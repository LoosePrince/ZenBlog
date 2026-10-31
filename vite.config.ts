
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 使用绝对根路径：SSG 会为 /about/ 等子目录生成 index.html，
  // 相对路径 './assets/' 在子目录下会被解析成 /about/assets/ 而 404。
  base: '/',
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  }
});
