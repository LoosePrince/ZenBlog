import React from 'react';
import { FileText, Image, Music, Film, File } from 'lucide-react';
import type { ZenFileBlock } from '../types';
import { useTheme } from '../App';

interface FileBlockViewProps {
  block: ZenFileBlock;
  fileUrl: string | null;
  txtPreview?: string | null;
}

function getMimeCategory(mime: string): 'image' | 'audio' | 'video' | 'txt' | 'pdf' | 'other' {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  if (mime === 'text/plain') return 'txt';
  if (mime === 'application/pdf') return 'pdf';
  return 'other';
}

const Caption: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 mb-4" aria-label="文件标注">
    {text}
  </p>
);

const FileBlockView: React.FC<FileBlockViewProps> = ({ block, fileUrl, txtPreview }) => {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const category = getMimeCategory(block.mime);
  const label = block.caption || block.name;

  const handleDownloadClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!fileUrl) return;

    // 对于本地 blob/data URL，浏览器会根据 download 属性正确使用文件名
    if (fileUrl.startsWith('blob:') || fileUrl.startsWith('data:')) {
      return;
    }

    try {
      e.preventDefault();
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = block.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // 回退到直接打开链接，避免完全失败
      window.open(fileUrl, '_blank');
    }
  };

  if (!fileUrl) {
    return (
      <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-6 bg-gray-50 dark:bg-gray-800/50">
        <File className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" aria-hidden />
        <p className="text-sm text-gray-500 dark:text-gray-400">{block.name}</p>
        <Caption text={label} />
      </div>
    );
  }

  if (category === 'image') {
    return (
      <figure className="my-4" aria-label={block.name}>
        <img
          src={fileUrl}
          alt={block.name}
          className="rounded-xl shadow-lg max-w-full mx-auto block"
        />
        <Caption text={label} />
      </figure>
    );
  }

  if (category === 'audio') {
    return (
      <div className="my-4">
        <audio controls src={fileUrl} className="w-full max-w-md mx-auto block" aria-label={block.name} />
        <Caption text={label} />
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div className="my-4">
        <video controls src={fileUrl} className="rounded-xl max-w-full mx-auto block" aria-label={block.name} />
        <Caption text={label} />
      </div>
    );
  }

  if (category === 'txt' || category === 'pdf' || category === 'other') {
    const isTxt = category === 'txt';
    const Icon = category === 'pdf' ? FileText : category === 'txt' ? FileText : File;
    return (
      <div
        className={`my-4 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden ${
          isDark ? 'bg-gray-800/50' : 'bg-gray-50'
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" aria-hidden />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{block.name}</span>
          </div>
          <a
            href={fileUrl}
            download={block.name}
            onClick={handleDownloadClick}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            下载
          </a>
        </div>
        {isTxt && txtPreview != null && txtPreview.length > 0 && (
          <pre className="p-4 text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-600">
            {txtPreview}
          </pre>
        )}
        <div className="px-4 py-2">
          <Caption text={label} />
        </div>
      </div>
    );
  }

  return (
    <div className="my-4">
      <Caption text={label} />
    </div>
  );
};

export default FileBlockView;
