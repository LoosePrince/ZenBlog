/**
 * SSG 预渲染脚本。
 *
 * 流程：
 *   1. vite build              → dist/（客户端产物 + index.html 模板）
 *   2. vite build --ssr        → dist-ssr/entry-ssg.js（可被 Node 调用的 render）
 *   3. 本脚本                  → 逐路由渲染并注入 HTML
 *
 * 用法：node ssg.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.resolve(__dirname, 'dist');
const ssrBundlePath = path.resolve(__dirname, 'dist-ssr', 'entry-ssg.js');

async function main() {
  try {
    await fs.access(ssrBundlePath);
  } catch {
    console.error(`[ssg] 未找到 SSR 产物：${ssrBundlePath}`);
    console.error('[ssg] 请先执行 vite build --ssr entry-ssg.tsx --outDir dist-ssr');
    process.exit(1);
  }

  const { render, PRERENDER_PATHS } = await import(pathToFileURL(ssrBundlePath).href);
  const ROUTES = (PRERENDER_PATHS && Array.from(PRERENDER_PATHS)) || ['/'];

  const indexHtmlPath = path.join(distDir, 'index.html');
  const template = await fs.readFile(indexHtmlPath, 'utf-8');

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function injectMetadata(html, metadata) {
    if (!metadata) return html;
    let out = html;
    if (metadata.language) {
      out = out.replace(
        /<html\b[^>]*\blang="[^"]*"[^>]*>/i,
        `<html lang="${escapeHtml(metadata.language)}">`
      );
    }
    if (metadata.title) {
      out = out.replace(
        /<title>[^<]*<\/title>/i,
        `<title>${escapeHtml(metadata.title)}</title>`
      );
    }
    if (metadata.description) {
      const desc = escapeHtml(metadata.description);
      if (/<meta\s+name="description"[^>]*>/i.test(out)) {
        out = out.replace(
          /<meta\s+name="description"[^>]*>/i,
          `<meta name="description" content="${desc}" />`
        );
      } else {
        out = out.replace('</head>', `    <meta name="description" content="${desc}" />\n</head>`);
      }
    }
    return out;
  }

  function injectAppHtml(appHtml, metadata) {
    let html = injectMetadata(template, metadata);
    // 模板结构：<div id="root"> 包着 #initial-loader，随后紧跟 </body>
    // 直接把整个 root 块替换成渲染结果，顺带去掉加载动画。
    const rootBlock = /<div id="root">[\s\S]*?<\/div>\s*<\/body>/;
    if (rootBlock.test(html)) {
      return html.replace(rootBlock, `<div id="root">${appHtml}</div>\n</body>`);
    }
    if (html.includes('<div id="root"></div>')) {
      return html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);
    }
    console.warn('[ssg] 未在模板中找到 <div id="root">，返回原始模板');
    return html;
  }

  let generated = 0;
  for (const url of ROUTES) {
    const { html, metadata } = await render(url);
    const finalHtml = injectAppHtml(html, metadata);

    const outPath =
      url === '/'
        ? path.join(distDir, 'index.html')
        : path.join(distDir, url.replace(/^\//, ''), 'index.html');

    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, finalHtml, 'utf-8');
    generated += 1;
    console.log('[ssg] generated', path.relative(distDir, outPath));
  }

  // GitHub Pages：拷贝 404.html 作为 SPA 回退，避免深链接 404
  const notFoundSrc = path.join(distDir, 'index.html');
  const notFoundDst = path.join(distDir, '404.html');
  await fs.copyFile(notFoundSrc, notFoundDst);
  console.log('[ssg] generated 404.html (SPA fallback)');

  console.log(`[ssg] 完成预渲染路由 ${generated} 条:`, ROUTES.join(', '));
}

main().catch((err) => {
  console.error('[ssg] 失败:', err);
  process.exit(1);
});
