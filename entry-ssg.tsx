/**
 * SSG 入口：供 ssg.mjs 在 Node 环境调用，逐路由渲染成静态 HTML。
 */
import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import './src/index.css';

export const PRERENDER_PATHS = ['/', '/about', '/login'];

export async function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <App serverSnapshot />
    </StaticRouter>
  );

  return {
    html,
    metadata: {
      language: 'zh-CN',
      title: 'ZenBlog',
      description: 'ZenBlog — 由 GitHub 驱动的现代化个人博客',
    },
  };
}
