import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './src/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// GitHub Pages 的 404 回退会把深链接重定向到根路径，
// 这里把原始路径恢复回来，用户感知不到跳转。
try {
  const pending = sessionStorage.getItem('zenblog_redirect');
  if (pending) {
    sessionStorage.removeItem('zenblog_redirect');
    if (pending !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, '', pending);
    }
  }
} catch {
  /* 忽略隐私模式下的存储异常 */
}

// SSG 预渲染过内容，用 hydrateRoot 接管；开发模式（无预渲染）回退到 createRoot。
const hasPrerenderedContent = rootElement.children.length > 0;

if (hasPrerenderedContent) {
  ReactDOM.hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
