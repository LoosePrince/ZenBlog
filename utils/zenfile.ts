import type { ZenFileBlock } from '../types';

export type ContentSegment =
  | { type: 'markdown'; value: string }
  | { type: 'file'; value: ZenFileBlock };

const ZENFILE_DIV_REGEX = /<div\s+data-zenfile\s+([^>]*)\s*>\s*<\/div>/gi;

function parseAttributes(attrString: string): ZenFileBlock | null {
  const uuid = attrString.match(/data-uuid="([^"]*)"/)?.[1];
  const name = attrString.match(/data-name="([^"]*)"/)?.[1];
  const caption = attrString.match(/data-caption="([^"]*)"/)?.[1];
  const mime = attrString.match(/data-mime="([^"]*)"/)?.[1];
  if (!uuid || !name || !mime) return null;
  return { uuid, name, caption: caption ?? undefined, mime };
}

/**
 * 将文章内容解析为「Markdown 文本段」与「文件块」交替的 segments。
 * 无 data-zenfile div 时返回单段 { type: 'markdown', value: content }。
 */
export function parseContentToSegments(content: string): ContentSegment[] {
  if (!content) return [{ type: 'markdown', value: '' }];
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  ZENFILE_DIV_REGEX.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ZENFILE_DIV_REGEX.exec(content)) !== null) {
    const before = content.slice(lastIndex, m.index);
    if (before.length > 0) {
      segments.push({ type: 'markdown', value: before });
    }
    const attrs = parseAttributes(m[1]);
    if (attrs) {
      segments.push({ type: 'file', value: attrs });
    } else {
      segments.push({ type: 'markdown', value: m[0] });
    }
    lastIndex = ZENFILE_DIV_REGEX.lastIndex;
  }
  const tail = content.slice(lastIndex);
  if (tail.length > 0 || segments.length === 0) {
    segments.push({ type: 'markdown', value: tail });
  }
  if (segments.length === 0) {
    segments.push({ type: 'markdown', value: content });
  }
  return segments;
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 将 segments 序列化为带 <div data-zenfile ...></div> 的完整 Markdown 字符串。
 */
export function serializeSegmentsToContent(segments: ContentSegment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === 'markdown') return seg.value;
      const { uuid, name, caption, mime } = seg.value;
      const cap = caption != null ? ` data-caption="${escapeAttr(caption)}"` : '';
      return `<div data-zenfile data-uuid="${escapeAttr(uuid)}" data-name="${escapeAttr(name)}" data-mime="${escapeAttr(mime)}"${cap}></div>`;
    })
    .join('');
}

/**
 * 公开仓库下 raw 文件 URL，用于直接展示/下载。
 */
export function getFileRawUrl(
  owner: string,
  repo: string,
  branch: string,
  path: string
): string {
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}
