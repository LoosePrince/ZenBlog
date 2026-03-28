import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Eye, FileText, Calendar, Settings, Clock, Type, ChevronRight } from 'lucide-react';
import { Post, GitHubConfig, EditorFileState } from '../types';
import { GitHubService } from '../services/githubService';
import { useLanguage, formatDate } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { parseContentToSegments, getFileRawUrl, type ContentSegment } from '../utils/zenfile';
import FileBlockEditor from '../components/FileBlockEditor';
import FileBlockView from '../components/FileBlockView';
import InsertFileButton from '../components/InsertFileButton';

interface EditorProps {
  posts: Post[];
  config: GitHubConfig | null;
  onSave: (
    postData: Partial<Post>,
    content: string,
    options?: {
      pendingFiles?: Array<{ localId: string; file: File }>;
      onProgress?: (current: number, total: number) => void;
      signal?: AbortSignal;
    }
  ) => Promise<void>;
}

const inputBase =
  'w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-400/25 dark:focus:ring-slate-500/30 focus:border-slate-400 dark:focus:border-slate-500';

const textareaField = `${inputBase} resize-none leading-relaxed`;

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 disabled:pointer-events-none transition-colors';

const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

function SaveSpinner() {
  return (
    <div
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white dark:border-slate-900 border-t-transparent dark:border-t-transparent"
      aria-hidden
    />
  );
}

const Editor: React.FC<EditorProps> = ({ posts, config, onSave }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isNew = id === 'new';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [fileStates, setFileStates] = useState<Record<string, EditorFileState>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [uploadModal, setUploadModal] = useState<{ current: number; total: number } | null>(null);
  const [previewFileUrls, setPreviewFileUrls] = useState<Record<string, string>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isNew) return;
    const post = posts.find((p) => p.id === id);
    if (!post || !config) {
      if (!isNew) navigate('/');
      return;
    }
    setTitle(post.title);
    setExcerpt(post.excerpt);
    setCategory(post.category);
    const fetchContent = async () => {
      try {
        const service = new GitHubService(config);
        const { content: raw } = await service.getFile(post.contentPath);
        setContent(raw);
      } catch (err: any) {
        alert(t.editor.loadError + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [id, posts, config, isNew, navigate, t.editor.loadError]);

  useEffect(() => {
    if (!config) {
      setPreviewFileUrls({});
      return;
    }
    const parsed = parseContentToSegments(content);
    const fileSegments = parsed.filter((s): s is ContentSegment & { type: 'file' } => s.type === 'file');
    if (fileSegments.length === 0) {
      setPreviewFileUrls({});
      return;
    }
    const owner = config.owner;
    const repo = config.repo;
    const branch = config.branch || 'data';
    const urls: Record<string, string> = {};
    for (const seg of fileSegments) {
      const { uuid } = seg.value;
      if (uuid.startsWith('local-')) continue;
      urls[uuid] = getFileRawUrl(owner, repo, branch, `data/files/${uuid}`);
    }
    setPreviewFileUrls(urls);
  }, [config, content]);

  const escapeAttr = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/\"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const handleInsertFiles = useCallback(
    (files: File[]) => {
      if (!files.length) return;
      const textarea = textareaRef.current;
      const selectionStart = textarea?.selectionStart ?? content.length;
      const selectionEnd = textarea?.selectionEnd ?? selectionStart;

      let insertText = '';
      const newStates: Record<string, EditorFileState> = {};

      for (const file of files) {
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const mime = file.type || 'application/octet-stream';
        const previewUrl = URL.createObjectURL(file);
        newStates[localId] = { localId, file, previewUrl };
        insertText += `\n<div data-zenfile data-uuid="${escapeAttr(localId)}" data-name="${escapeAttr(
          file.name
        )}" data-mime="${escapeAttr(mime)}"></div>\n`;
      }

      setFileStates((prev) => ({ ...prev, ...newStates }));
      setContent((prev) => prev.slice(0, selectionStart) + insertText + prev.slice(selectionEnd));
    },
    [content]
  );

  const handleSave = async () => {
    if (!title || !content.trim()) {
      toast.error(t.editor.emptyFields);
      return;
    }
    const parsedSegments = parseContentToSegments(content);
    const pendingFiles = parsedSegments
      .filter((s) => s.type === 'file')
      .filter((s) => s.value.uuid.startsWith('local-') && fileStates[s.value.uuid]?.file)
      .map((s) => ({ localId: s.value.uuid, file: fileStates[s.value.uuid]!.file }));
    const totalSteps = pendingFiles.length + 1;
    const hasUpload = pendingFiles.length > 0;
    if (hasUpload) {
      abortControllerRef.current = new AbortController();
      setUploadModal({ current: 0, total: totalSteps });
    }
    setSaving(true);
    const loadingToast = hasUpload ? undefined : toast.loading(t.editor.saving);
    try {
      const postData: Partial<Post> = {
        id: isNew ? Math.random().toString(36).substr(2, 9) : id,
        title,
        excerpt: excerpt || content.substring(0, 150).replace(/\n/g, ' ') + '...',
        category,
        date: isNew ? new Date().toISOString() : undefined,
      };
      await onSave(postData, content, {
        pendingFiles: hasUpload ? pendingFiles : undefined,
        onProgress: hasUpload ? (current: number, total: number) => setUploadModal((m) => (m ? { current, total } : null)) : undefined,
        signal: hasUpload ? abortControllerRef.current?.signal : undefined,
      });
      if (!hasUpload) toast.success(t.editor.saveSuccess, { id: loadingToast });
      else toast.success(t.editor.saveSuccess);
      setUploadModal(null);
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      setUploadModal(null);
      if (err.message === '已取消上传') {
        toast(t.editor.cancelUpload || '已取消上传');
      } else {
        toast.error(t.editor.saveFailed + ': ' + err.message, { id: loadingToast });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <div
          className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700 dark:border-slate-700 dark:border-t-slate-200"
          aria-hidden
        />
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.editor.preparing}</p>
      </div>
    );
  }

  const wordCount = content.length;
  const estimatedReadTime = Math.ceil(wordCount / 500) || 1;
  const segments = parseContentToSegments(content);

  const sidebarFields = (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.editor.category}</label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t.editor.category}
          className={inputBase}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">{t.editor.excerpt}</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={4}
          placeholder={t.editor.excerptHint}
          className={textareaField}
        />
      </div>
    </div>
  );

  return (
    <div className="relative pb-28 md:pb-6">
      <div className="mb-6 rounded-lg border border-slate-200/80 bg-slate-50 px-4 py-5 dark:border-slate-700 dark:bg-slate-900/40 sm:px-5">
        <nav className="mb-3 flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
          <span>{t.settings.breadcrumbAdmin}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {isNew ? t.nav.newPost : t.editor.breadcrumbEditPost}
          </span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              {isNew ? t.editor.pageHeadingNew : t.editor.pageHeadingEdit}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{t.editor.pageSubtitle}</p>
          </div>
          <div className="hidden shrink-0 items-center gap-2 md:flex">
            <button type="button" onClick={() => navigate(-1)} className={btnSecondary}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.editor.cancel}
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={previewMode ? `${btnSecondary} border-slate-900/20 bg-slate-100 dark:bg-slate-800` : btnSecondary}
            >
              {previewMode ? <FileText className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {previewMode ? t.editor.edit : t.editor.preview}
            </button>
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? (
                <>
                  <SaveSpinner />
                  {t.editor.saving}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" aria-hidden />
                  {isNew ? t.editor.publish : t.editor.save}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3 md:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t.editor.cancel}
        </button>
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium shadow-sm ${
            previewMode
              ? 'border-slate-300 bg-slate-100 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'
              : 'border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200'
          }`}
        >
          {previewMode ? <FileText className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {previewMode ? t.editor.edit : t.editor.preview}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="min-h-[70vh] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50 lg:col-span-2">
          {!previewMode ? (
            <div className="space-y-5 p-5 md:p-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.editor.titlePlaceholder}
                className="w-full border-none bg-transparent text-2xl font-semibold tracking-tight text-slate-900 placeholder:text-slate-300 outline-none dark:text-slate-100 dark:placeholder:text-slate-600 md:text-3xl"
              />
              <div className="h-px bg-slate-100 dark:bg-slate-700" />
              <div className="flex flex-wrap items-center gap-2">
                <InsertFileButton onSelect={handleInsertFiles}>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.editor.insertFile}</span>
                </InsertFileButton>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.editor.contentPlaceholder}
                className="min-h-[55vh] w-full resize-none border-none bg-transparent font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none dark:text-slate-200 dark:placeholder:text-slate-500 md:text-base"
                style={{ fontFamily: 'inherit' }}
              />

              {segments.some((s) => s.type === 'file') && (
                <div className="mt-4 border-t border-dashed border-slate-200 pt-4 dark:border-slate-600">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {t.editor.fileListPreview}
                  </h3>
                  <div className="space-y-3">
                    {segments
                      .filter((s) => s.type === 'file')
                      .map((s, index) => {
                        const state = fileStates[s.value.uuid];
                        const previewUrl = state?.previewUrl ?? null;
                        const handleDelete = () => {
                          const escaped = s.value.uuid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          const regex = new RegExp(
                            `<div\\s+data-zenfile[^>]*data-uuid="${escaped}"[^>]*>\\s*<\\/div>`,
                            'g'
                          );
                          setContent((prev) => prev.replace(regex, ''));
                          setFileStates((prev) => {
                            const next = { ...prev };
                            const st = next[s.value.uuid];
                            if (st?.previewUrl) URL.revokeObjectURL(st.previewUrl);
                            delete next[s.value.uuid];
                            return next;
                          });
                        };
                        return (
                          <FileBlockEditor
                            key={`${s.value.uuid}-${index}`}
                            block={s.value}
                            previewUrl={previewUrl}
                            onDelete={handleDelete}
                          />
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="markdown-content p-5 md:p-6">
              <h1 className="mb-6 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">
                {title || t.editor.titlePlaceholder}
              </h1>
              <div className="mb-8 h-px bg-slate-100 dark:bg-slate-700" />
              <div className="space-y-4 text-slate-700 dark:text-slate-300" style={{ fontSize: '1rem', lineHeight: '1.75' }}>
                {segments.map((seg, index) =>
                  seg.type === 'markdown' ? (
                    <ReactMarkdown
                      key={index}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: (props) => <h1 className="mt-8 mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100" {...props} />,
                        h2: (props) => <h2 className="mt-6 mb-3 text-xl font-semibold text-slate-900 dark:text-slate-100" {...props} />,
                        h3: (props) => <h3 className="mt-5 mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100" {...props} />,
                        p: (props) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
                        ul: (props) => <ul className="mb-4 list-disc space-y-2 pl-6" {...props} />,
                        ol: (props) => <ol className="mb-4 list-decimal space-y-2 pl-6" {...props} />,
                        li: (props) => <li className="pl-1" {...props} />,
                        blockquote: (props) => (
                          <blockquote
                            className="my-4 border-l-4 border-slate-300 bg-slate-50 py-2 pr-2 pl-4 italic text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-400"
                            {...props}
                          />
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code
                              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-200"
                              {...props}
                            >
                              {children}
                            </code>
                          ) : (
                            <code className="my-4 block overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100" {...props}>
                              {children}
                            </code>
                          );
                        },
                        img: (props) => <img className="my-4 max-w-full rounded-lg shadow-md" {...props} />,
                        hr: (props) => <hr className="my-8 border-slate-200 dark:border-slate-700" {...props} />,
                      }}
                    >
                      {seg.value || (index === 0 ? t.editor.contentPlaceholder : '')}
                    </ReactMarkdown>
                  ) : (
                    <FileBlockView
                      key={index}
                      block={seg.value}
                      fileUrl={fileStates[seg.value.uuid]?.previewUrl ?? previewFileUrls[seg.value.uuid] ?? null}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="hidden space-y-4 lg:block lg:sticky lg:top-24 lg:self-start">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
            <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Settings className="h-4 w-4" aria-hidden />
                </div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.editor.properties}</h2>
              </div>
            </div>
            <div className="px-4 py-4 sm:px-5">{sidebarFields}</div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-800/40 sm:px-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{t.editor.stats}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Type className="h-4 w-4 opacity-70" aria-hidden />
                  {t.editor.wordCount}
                </span>
                <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{wordCount}</span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-600" />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="h-4 w-4 opacity-70" aria-hidden />
                  {t.editor.readTime}
                </span>
                <span className="font-medium tabular-nums text-slate-900 dark:text-slate-100">
                  {estimatedReadTime} {t.editor.minute}
                </span>
              </div>
              <div className="h-px bg-slate-200 dark:bg-slate-600" />
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4 opacity-70" aria-hidden />
                  {t.editor.date}
                </span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {formatDate(new Date(), 'editor', language)}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 md:hidden">
        <div className="flex items-center justify-between gap-2 p-3">
          <button
            type="button"
            onClick={() => setShowMobileSettings(!showMobileSettings)}
            className={`rounded-md border p-2.5 transition-colors ${
              showMobileSettings
                ? 'border-slate-800 bg-slate-100 text-slate-900 dark:border-slate-300 dark:bg-slate-800 dark:text-slate-100'
                : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
            aria-expanded={showMobileSettings}
            aria-label={t.editor.properties}
          >
            <Settings className="h-5 w-5" aria-hidden />
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center px-2">
            <span className="truncate text-xs font-medium text-slate-900 dark:text-slate-100">
              {wordCount} {t.editor.wordCount}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">
              {estimatedReadTime} {t.post.minRead}
            </span>
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className={`${btnPrimary} shrink-0 px-4 py-2.5`}>
            {saving ? (
              <>
                <SaveSpinner />
                {t.editor.saving}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden />
                {isNew ? t.editor.publish : t.editor.save}
              </>
            )}
          </button>
        </div>

        <AnimatePresence>
          {showMobileSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="space-y-4 p-4">{sidebarFields}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {uploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex flex-col items-center gap-4">
                <div
                  className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800 dark:border-slate-600 dark:border-t-slate-200"
                  aria-hidden
                />
                <p className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                  {(t.editor.uploadingProgress || '上传中 ({{current}}/{{total}})')
                    .replace('{{current}}', String(uploadModal.current))
                    .replace('{{total}}', String(uploadModal.total))}
                </p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <motion.div
                    className="h-full bg-slate-800 dark:bg-slate-200"
                    initial={{ width: 0 }}
                    animate={{ width: `${(uploadModal.current / uploadModal.total) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  disabled={uploadModal.current >= uploadModal.total}
                  className="text-sm font-medium text-slate-600 hover:text-red-600 disabled:opacity-50 dark:text-slate-400 dark:hover:text-red-400"
                >
                  {t.editor.cancelUpload || '取消上传'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Editor;
