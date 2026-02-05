import React from 'react';
import { FileText, Image, Music, Film, File, Trash2 } from 'lucide-react';
import type { ZenFileBlock } from '../types';
import { useTheme, useLanguage } from '../App';

interface FileBlockEditorProps {
  block: ZenFileBlock;
  previewUrl: string | null;
  txtPreview?: string | null;
  onDelete: () => void;
  onCaptionChange?: (caption: string) => void;
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
  <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 mb-2" aria-label="文件标注">
    {text}
  </p>
);

const FileBlockEditor: React.FC<FileBlockEditorProps> = ({
  block,
  previewUrl,
  txtPreview,
  onDelete,
}) => {
  const { effectiveTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = effectiveTheme === 'dark';
  const category = getMimeCategory(block.mime);
  const label = block.caption || block.name;
  const downloadLabel = t.common.download || t.editor.download;

  const wrapperClass =
    'my-4 rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden relative group';

  const deleteButton = (
    <button
      type="button"
      onClick={onDelete}
      className="absolute top-2 right-2 z-10 p-2 rounded-lg bg-black/50 hover:bg-red-600/90 text-white transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
      aria-label="删除此文件"
    >
      <Trash2 size={16} />
    </button>
  );

  if (!previewUrl) {
    return (
      <div className={`${wrapperClass} bg-gray-50 dark:bg-gray-800/50 p-6 flex flex-col items-center`}>
        {deleteButton}
        <File className="w-10 h-10 text-gray-400 dark:text-gray-500 mb-2" aria-hidden />
        <p className="text-sm text-gray-500 dark:text-gray-400">{block.name}</p>
        <Caption text={label} />
      </div>
    );
  }

  if (category === 'image') {
    return (
      <figure className={wrapperClass} aria-label={block.name}>
        {deleteButton}
        <img
          src={previewUrl}
          alt={block.name}
          className="rounded-xl max-w-full mx-auto block w-full"
        />
        <Caption text={label} />
      </figure>
    );
  }

  if (category === 'audio') {
    return (
      <div className={wrapperClass}>
        {deleteButton}
        <div className="p-4 pt-10">
          <audio controls src={previewUrl} className="w-full max-w-md mx-auto block" aria-label={block.name} />
        </div>
        <Caption text={label} />
      </div>
    );
  }

  if (category === 'video') {
    return (
      <div className={wrapperClass}>
        {deleteButton}
        <div className="p-4 pt-10">
          <video controls src={previewUrl} className="rounded-xl max-w-full mx-auto block" aria-label={block.name} />
        </div>
        <Caption text={label} />
      </div>
    );
  }

  if (category === 'txt' || category === 'pdf' || category === 'other') {
    const isTxt = category === 'txt';
    const Icon = category === 'pdf' ? FileText : category === 'txt' ? FileText : File;
    return (
      <div className={`${wrapperClass} ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
        {deleteButton}
        <div className="flex items-center justify-between gap-3 px-4 py-3 pt-10 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" aria-hidden />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{block.name}</span>
          </div>
          <a
            href={previewUrl}
            download={block.name}
            className="flex-shrink-0 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
          >
            {downloadLabel}
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
    <div className={wrapperClass}>
      {deleteButton}
      <Caption text={label} />
    </div>
  );
};

export default FileBlockEditor;
