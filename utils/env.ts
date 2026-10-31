/**
 * SSR 安全的浏览器能力访问层。
 * 在 Node（SSG 构建）环境下所有读取返回默认值、写入静默忽略。
 */

export const isBrowser = typeof window !== 'undefined';

export const safeStorage = {
  get(key: string): string | null {
    if (!isBrowser) return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* 隐私模式下可能被禁用，忽略 */
    }
  },
  remove(key: string): void {
    if (!isBrowser) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
