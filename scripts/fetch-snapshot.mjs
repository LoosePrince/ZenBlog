/**
 * 构建期数据快照：把 GitHub data 分支的内容抓下来，落成静态 JSON。
 *
 * 为什么需要它：ZenBlog 原本是纯运行时从 GitHub API 拉数据，
 * 但 SSG 必须在构建时就拿到文章列表和站点信息，才能预渲染出完整 HTML。
 *
 * 用法：node scripts/fetch-snapshot.mjs
 * 产物：src/generated/snapshot.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outFile = path.join(rootDir, 'src', 'generated', 'snapshot.json');

const TOKEN = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();

function readPublicConfig() {
  const p = path.join(rootDir, 'public', 'config.json');
  return fs.readFile(p, 'utf-8').then((t) => JSON.parse(t));
}

function apiUrl(owner, repo, branch, filePath) {
  return `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
}

async function fetchJsonFile(owner, repo, branch, filePath, { retries = 3 } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'zenblog-ssg',
  };
  // 公开仓库不需要 token；私有仓库或为避免速率限制时需要。
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(apiUrl(owner, repo, branch, filePath), { headers });
      if (res.status === 404) return null;
      if (!res.ok) {
        const body = await res.text();
        const retryable = res.status === 403 || res.status === 429 || res.status >= 500;
        if (retryable && attempt < retries) {
          const wait = attempt * 2000;
          console.warn(`[snapshot] ${filePath} 返回 ${res.status}，${wait}ms 后重试(${attempt}/${retries})`);
          await new Promise((r) => setTimeout(r, wait));
          lastErr = new Error(`GitHub ${res.status}: ${body.slice(0, 200)}`);
          continue;
        }
        throw new Error(`GitHub ${res.status} for ${filePath}: ${body.slice(0, 200)}`);
      }
      const body = await res.json();
      const content = Buffer.from(
        body.content || '',
        body.encoding === 'base64' ? 'base64' : 'utf-8'
      ).toString('utf-8');
      return JSON.parse(content);
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) throw err;
    }
  }
  throw lastErr || new Error('unknown error');
}

/**
 * 抓取原始文本文件（文章正文 .md）。
 * 优先走 contents API；文件较大时自动回退 raw 地址。
 */
async function fetchRawText(owner, repo, branch, filePath, { retries = 3 } = {}) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'zenblog-ssg',
  };
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(apiUrl(owner, repo, branch, filePath), { headers });
      if (res.status === 404) return '';
      if (!res.ok) {
        const retryable = res.status === 403 || res.status === 429 || res.status >= 500;
        if (retryable && attempt < retries) {
          await new Promise((r) => setTimeout(r, attempt * 2000));
          lastErr = new Error(`GitHub ${res.status}`);
          continue;
        }
        throw new Error(`GitHub ${res.status} for ${filePath}`);
      }
      const body = await res.json();
      if (body?.content) {
        return Buffer.from(
          body.content,
          body.encoding === 'base64' ? 'base64' : 'utf-8'
        ).toString('utf-8');
      }
      // 大文件无 content 字段，回退 raw
      const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      const rawRes = await fetch(rawUrl, { headers: { 'User-Agent': 'zenblog-ssg' } });
      if (!rawRes.ok) throw new Error(`raw ${rawRes.status}`);
      return await rawRes.text();
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) throw err;
    }
  }
  throw lastErr || new Error('unknown error');
}

async function main() {
  const STRICT = process.argv.includes('--strict');

  let config;
  try {
    config = await readPublicConfig();
  } catch {
    console.warn('[snapshot] 未找到 public/config.json，使用空快照');
    config = {};
  }

  const owner = (config.owner || '').trim();
  const repo = (config.repo || '').trim();
  const branch = (config.branch || 'data').trim();

  let posts = [];
  let profile = null;
  let fetchFailed = false;

  if (owner && repo) {
    console.log(`[snapshot] 抓取 ${owner}/${repo}@${branch}`);
    if (!TOKEN) {
      console.warn('[snapshot] 未提供 GITHUB_TOKEN，将受匿名速率限制（60 次/小时）');
    }
    try {
      const [fetchedPosts, fetchedProfile] = await Promise.all([
        fetchJsonFile(owner, repo, branch, 'data/posts.json'),
        fetchJsonFile(owner, repo, branch, 'data/profile.json'),
      ]);
      posts = fetchedPosts || [];
      profile = fetchedProfile;
      console.log(`[snapshot] 文章 ${posts.length} 篇`);
    } catch (err) {
      fetchFailed = true;
      console.warn(`[snapshot] 抓取失败：${err.message}`);
      if (STRICT) {
        console.error('[snapshot] --strict 模式：抓取失败即中止构建，避免部署空内容站点');
        process.exit(1);
      }
      console.warn('[snapshot] 继续构建，但内容可能为空');
    }
  } else {
    console.warn('[snapshot] config.json 缺少 owner/repo，跳过抓取');
  }

  // 逐篇抓取正文，用于文章详情页预渲染。
  // 顺序执行并限制并发，避免触发 GitHub 速率限制。
  if (Array.isArray(posts) && posts.length) {
    let ok = 0;
    for (const post of posts) {
      const contentPath = typeof post?.contentPath === 'string' ? post.contentPath : '';
      if (!contentPath) continue;
      try {
        const content = await fetchRawText(owner, repo, branch, contentPath);
        if (typeof content === 'string') {
          post.content = content;
          ok += 1;
        }
      } catch (err) {
        console.warn(`[snapshot] 正文抓取失败 ${contentPath}：${err.message}`);
      }
    }
    console.log(`[snapshot] 正文 ${ok}/${posts.length} 篇`);
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
    fetchFailed,
    config: { owner, repo, branch },
    posts: Array.isArray(posts) ? posts : [],
    profile,
  };

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, JSON.stringify(snapshot, null, 2), 'utf-8');
  console.log(`[snapshot] 已写入 ${path.relative(rootDir, outFile)}`);
}

main().catch((err) => {
  console.error('[snapshot] 失败:', err);
  process.exit(1);
});
