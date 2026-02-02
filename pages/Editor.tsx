import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Eye, FileText, Calendar, Settings, ChevronDown, Clock, Type } from 'lucide-react';
import { Post, GitHubConfig, EditorFileState } from '../types';
import { GitHubService } from '../services/githubService';
import { useLanguage, useTheme, formatDate } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { parseContentToSegments } from '../utils/zenfile';
import FileBlockEditor from '../components/FileBlockEditor';
import FileBlockView from '../components/FileBlockView';
import InsertFileButton from '../components/InsertFileButton';

interface EditorProps {
  posts: Post[];
  config: GitHubConfig | null;
  onSave: (postData: Partial<Post>, content: string, options?: {
    pendingFiles?: Array<{ localId: string; file: File }>;
    onProgress?: (current: number, total: number) => void;
    signal?: AbortSignal;
  }) => Promise<void>;
}

const Editor: React.FC<EditorProps> = ({ posts, config, onSave }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { effectiveTheme } = useTheme();
  const isNew = id === 'new';
  const isDark = effectiveTheme === 'dark';
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(t.editor.categories.life);
  const [content, setContent] = useState('');
  const [fileStates, setFileStates] = useState<Record<string, EditorFileState>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [previewMode, setPreviewMode] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [uploadModal, setUploadModal] = useState<{ current: number; total: number } | null>(null);
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
        <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">{t.editor.preparing}</p>
      </div>
    );
  }

  const wordCount = content.length;
  const estimatedReadTime = Math.ceil(wordCount / 500) || 1;
  const segments = parseContentToSegments(content);

  return (
    <div className="relative pb-24 md:pb-0">
      {/* 桌面端顶部工具栏 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)} 
            className="group inline-flex items-center text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            {t.editor.cancel}
          </button>
          <div className="h-6 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
          <span className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {isNew ? t.editor.newPost || '撰写文章' : t.editor.editing || '编辑文章'}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all border ${
              previewMode 
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {previewMode ? <FileText size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
            {previewMode ? (t.editor.edit || '返回编辑') : (t.editor.preview || '预览文章')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-8 py-2.5 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all text-sm uppercase tracking-widest shadow-sm hover:shadow-md"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mr-2"></div>
            ) : (
              <Save size={16} className="mr-2" />
            )}
            {saving ? t.editor.saving : (isNew ? t.editor.publish : t.editor.save)}
          </button>
        </div>
      </motion.div>

      {/* 移动端顶部简化工具栏 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden flex items-center justify-between mb-4 bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
          {isNew ? t.editor.newPost || '新文章' : t.editor.editing || '编辑中'}
        </span>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className={`p-2 rounded-lg transition-all border ${
            previewMode 
              ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {previewMode ? <FileText size={18} /> : <Eye size={18} />}
        </button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* 左侧主要编辑区 (2/3) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 p-5 md:p-10 min-h-[80vh]"
        >
          {!previewMode ? (
            <div className="space-y-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.editor.titlePlaceholder}
                className="w-full text-2xl md:text-4xl font-black text-gray-900 dark:text-gray-100 border-none focus:ring-0 bg-transparent placeholder-gray-300 dark:placeholder-gray-600 outline-none tracking-tight"
              />
              <div className="h-[1px] bg-gray-100 dark:bg-gray-700"></div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <InsertFileButton onSelect={handleInsertFiles}>
                  <span className="text-sm font-bold">{t.editor.insertFile || '插入文件'}</span>
                </InsertFileButton>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.editor.contentPlaceholder}
                className="w-full min-h-[60vh] p-0 text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300 border-none focus:ring-0 bg-transparent resize-none placeholder-gray-300 dark:placeholder-gray-600 outline-none font-mono"
                style={{ fontFamily: 'inherit' }}
              />

              {/* 文件列表渲染区 */}
              {segments.some((s) => s.type === 'file') && (
                <div className="mt-6 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                    文件列表（预览）
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
            <div className="markdown-content">
              <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-gray-100 mb-8 tracking-tight">
                {title || t.editor.titlePlaceholder}
              </h1>
              <div className="h-[1px] bg-gray-100 dark:bg-gray-700 mb-8"></div>
              <div className="text-gray-700 dark:text-gray-300 space-y-4" style={{ fontSize: '1rem', lineHeight: '1.75' }}>
                {segments.map((seg, index) =>
                  seg.type === 'markdown' ? (
                    <ReactMarkdown
                      key={index}
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: (props) => <h1 className="text-2xl font-black mt-8 mb-4 text-gray-900 dark:text-gray-100" {...props} />,
                        h2: (props) => <h2 className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100" {...props} />,
                        h3: (props) => <h3 className="text-lg font-bold mt-5 mb-2 text-gray-900 dark:text-gray-100" {...props} />,
                        p: (props) => <p className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300" {...props} />,
                        ul: (props) => <ul className="list-disc pl-6 mb-4 space-y-2" {...props} />,
                        ol: (props) => <ol className="list-decimal pl-6 mb-4 space-y-2" {...props} />,
                        li: (props) => <li className="pl-1" {...props} />,
                        blockquote: (props) => (
                          <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-500 dark:text-gray-400 my-4 bg-gray-50 dark:bg-gray-900 py-2 pr-2 rounded-r-lg" {...props} />
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-indigo-600 dark:text-indigo-400" {...props}>
                              {children}
                            </code>
                          ) : (
                            <code className="block bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono my-4" {...props}>
                              {children}
                            </code>
                          );
                        },
                        img: (props) => <img className="rounded-xl shadow-lg my-4 max-w-full" {...props} />,
                        hr: (props) => <hr className="my-8 border-gray-200 dark:border-gray-700" {...props} />,
                      }}
                    >
                      {seg.value || (index === 0 ? t.editor.contentPlaceholder : '')}
                    </ReactMarkdown>
                  ) : (
                    <FileBlockView
                      key={index}
                      block={seg.value}
                      fileUrl={fileStates[seg.value.uuid]?.previewUrl ?? null}
                    />
                  )
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* 右侧侧边栏设置 (1/3) - 桌面端常驻 */}
        <div className="hidden lg:block space-y-6">
          {/* 发布设置卡片 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2 mb-6">
              <Settings size={20} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-black text-lg text-gray-900 dark:text-gray-100">{t.editor.properties || '文章属性'}</h3>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  {t.editor.category}
                </label>
                <div className="relative">
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm font-bold appearance-none cursor-pointer"
                  >
                    <option>{t.editor.categories.life}</option>
                    <option>{t.editor.categories.tech}</option>
                    <option>{t.editor.categories.essay}</option>
                    <option>{t.editor.categories.tutorial}</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                  {t.editor.excerpt}
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={4}
                  placeholder={t.editor.excerptHint}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* 统计信息卡片 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900"
          >
             <h3 className="font-black text-sm text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-4 opacity-70">
               {t.editor.stats || '统计信息'}
             </h3>
             
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <div className="flex items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                   <Type size={16} className="mr-2 opacity-50" />
                   {t.editor.wordCount || '字数'}
                 </div>
                 <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{wordCount}</span>
               </div>
               
               <div className="w-full h-[1px] bg-indigo-200 dark:bg-indigo-800/50"></div>
               
               <div className="flex items-center justify-between">
                 <div className="flex items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                   <Clock size={16} className="mr-2 opacity-50" />
                   {t.editor.readTime || '阅读时长'}
                 </div>
                 <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                   {estimatedReadTime} {t.editor.minute}
                 </span>
               </div>

               <div className="w-full h-[1px] bg-indigo-200 dark:bg-indigo-800/50"></div>

               <div className="flex items-center justify-between">
                 <div className="flex items-center text-sm font-bold text-gray-600 dark:text-gray-400">
                   <Calendar size={16} className="mr-2 opacity-50" />
                   {t.editor.date || '日期'}
                 </div>
                 <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                   {formatDate(new Date(), 'editor', language)}
                 </span>
               </div>
             </div>
          </motion.div>
        </div>
      </div>

      {/* 移动端底部固定工具栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 safe-area-bottom"
      >
        <div className="flex items-center justify-between p-3">
          {/* 设置按钮 */}
          <button
            onClick={() => setShowMobileSettings(!showMobileSettings)}
            className={`p-3 rounded-xl transition-colors ${
              showMobileSettings 
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Settings size={20} />
          </button>

          {/* 统计信息简略 */}
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
               {wordCount} {t.editor.wordCount}
             </span>
             <span className="text-[10px] text-gray-400 dark:text-gray-500">
               {estimatedReadTime} {t.post.minRead}
             </span>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-5 py-3 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all text-sm uppercase tracking-widest"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {t.editor.save}
              </>
            )}
          </button>
        </div>

        {/* 移动端设置面板 - 从底部滑出 */}
        <AnimatePresence>
          {showMobileSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden"
            >
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    {t.editor.category}
                  </label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm font-bold"
                  >
                    <option>{t.editor.categories.life}</option>
                    <option>{t.editor.categories.tech}</option>
                    <option>{t.editor.categories.essay}</option>
                    <option>{t.editor.categories.tutorial}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2">
                    {t.editor.excerpt}
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    placeholder={t.editor.excerptHint}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 上传进度模态框 */}
      <AnimatePresence>
        {uploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  {(t.editor.uploadingProgress || '上传中 ({{current}}/{{total}})')
                    .replace('{{current}}', String(uploadModal.current))
                    .replace('{{total}}', String(uploadModal.total))}
                </p>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-indigo-600 dark:bg-indigo-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${(uploadModal.current / uploadModal.total) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  disabled={uploadModal.current >= uploadModal.total}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
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