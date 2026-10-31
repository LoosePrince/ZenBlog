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

async function fetchJsonFile(owner, repo, branch, filePath) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'zenblog-ssg',
  };
  // 公开仓库不需要 token；私有仓库才需要。
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

  const res = await fetch(apiUrl(owner, repo, branch, filePath), { headers });
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GitHub ${res.status} for ${filePath}: ${await res.text()}`);
  }
  const body = await res.json();
  const content = Buffer.from(body.content || '', body.encoding === 'base64' ? 'base64' : 'utf-8').toString('utf-8');
  return JSON.parse(content);
}

async function main() {
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

  if (owner && repo) {
    console.log(`[snapshot] 抓取 ${owner}/${repo}@${branch}`);
    try {
      posts = (await fetchJsonFile(owner, repo, branch, 'data/posts.json')) || [];
      profile = await fetchJsonFile(owner, repo, branch, 'data/profile.json');
      console.log(`[snapshot] 文章 ${posts.length} 篇`);
    } catch (err) {
      console.warn(`[snapshot] 抓取失败，将使用空数据：${err.message}`);
    }
  } else {
    console.warn('[snapshot] config.json 缺少 owner/repo，跳过抓取');
  }

  const snapshot = {
    generatedAt: new Date().toISOString(),
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
