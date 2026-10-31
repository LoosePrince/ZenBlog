/**
 * SSG 入口：供 ssg.mjs 在 Node 环境调用，逐路由渲染成静态 HTML。
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import './src/index.css';
import snapshot from './src/generated/snapshot.json';

/** 从快照中提取文章 ID，生成详情页路由 */
function buildPostPaths(): string[] {
  const posts = Array.isArray((snapshot as { posts?: unknown }).posts)
    ? ((snapshot as { posts: Array<{ id?: string }> }).posts)
    : [];
  return posts
    .map((p) => (typeof p?.id === 'string' ? `/post/${p.id}` : ''))
    .filter(Boolean);
}

/** 静态路由 + 动态文章路由 */
export const PRERENDER_PATHS: string[] = [
  '/',
  '/about',
  '/login',
  ...buildPostPaths(),
];

export async function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App serverSnapshot />
    </StaticRouter>
  );

  // 文章详情页用文章标题做 title
  const post = Array.isArray((snapshot as { posts?: unknown }).posts)
    ? (snapshot as { posts: Array<{ id?: string; title?: string; excerpt?: string }> }).posts.find(
        (p) => typeof p?.id === 'string' && url === `/post/${p.id}`
      )
    : undefined;

  const profileName =
    (snapshot as { profile?: { name?: string } }).profile?.name || 'ZenBlog';

  return {
    html,
    metadata: {
      language: 'zh-CN',
      title: post?.title ? `${post.title} - ${profileName}` : profileName,
      description:
        post?.excerpt ||
        'ZenBlog — 由 GitHub 驱动的现代化个人博客',
    },
  };
}
