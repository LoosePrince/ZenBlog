/**
 * 运行环境标记：SSG 构建期与浏览器运行时行为差异的开关。
 * SSR 阶段置为 true，客户端始终为 false。
 */

let ssrMode = false;

export function setSsrMode(value: boolean): void {
  ssrMode = Boolean(value);
}

export function isSsrMode(): boolean {
  return ssrMode;
}
