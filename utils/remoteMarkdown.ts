import type { PostReference } from '../types';

export interface MarkdownImportMetadata {
  title?: string;
  excerpt?: string;
  category?: string;
  date?: string;
}

export interface ParsedRemoteMarkdown {
  metadata: MarkdownImportMetadata;
  content: string;
}

const FRONT_MATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

const normalizeGitHubUrl = (url: string): string => {
  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname !== 'github.com') return url.trim();

    const parts = parsed.pathname.split('/').filter(Boolean);
    const blobIndex = parts.indexOf('blob');
    if (parts.length >= 5 && blobIndex === 2) {
      const [owner, repo] = parts;
      const branch = parts[3];
      const path = parts.slice(4).join('/');
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    }
    return url.trim();
  } catch {
    return url.trim();
  }
};

const parseScalar = (value: string): string => {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

export const parseMarkdownWithMetadata = (raw: string): ParsedRemoteMarkdown => {
  const match = raw.match(FRONT_MATTER_RE);
  if (!match) return { metadata: {}, content: raw };

  const metadata: MarkdownImportMetadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!pair) continue;
    const key = pair[1].toLowerCase();
    const value = parseScalar(pair[2]);
    if (key === 'title') metadata.title = value;
    if (key === 'excerpt' || key === 'description') metadata.excerpt = value;
    if (key === 'category' || key === 'tags') metadata.category = value;
    if (key === 'date' || key === 'created' || key === 'createdat') metadata.date = value;
  }

  return { metadata, content: raw.slice(match[0].length).trimStart() };
};

export const fetchReferencedMarkdown = async (sourceUrl: string): Promise<ParsedRemoteMarkdown & { resolvedUrl: string }> => {
  const resolvedUrl = normalizeGitHubUrl(sourceUrl);
  const response = await fetch(resolvedUrl, { headers: { Accept: 'text/plain, text/markdown, */*' } });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const raw = await response.text();
  return { ...parseMarkdownWithMetadata(raw), resolvedUrl };
};

export const createPostReference = (sourceUrl: string, resolvedUrl?: string): PostReference => ({
  sourceUrl: sourceUrl.trim(),
  resolvedUrl: resolvedUrl?.trim() || normalizeGitHubUrl(sourceUrl),
  snapshotUpdatedAt: new Date().toISOString(),
});