
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Loader2, Eye, FileText, Tag, Calendar, Sparkles, X, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Post, GitHubConfig } from '../types';
import { GitHubService } from '../services/githubService';
import { useLanguage, useTheme } from '../App';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

interface EditorProps {
  posts: Post[];
  config: GitHubConfig | null;
  onSave: (postData: Partial<Post>, content: string) => Promise<void>;
}

const Editor: React.FC<EditorProps> = ({ posts, config, onSave }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { effectiveTheme } = useTheme();
  const isNew = id === 'new';
  const isDark = effectiveTheme === 'dark';
  
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [category, setCategory] = useState(t.editor.categories.life);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [previewMode, setPreviewMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isNew) return;
    
    const post = posts.find(p => p.id === id);
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
        const { content } = await service.getFile(post.contentPath);
        setContent(content);
      } catch (err: any) {
        alert(t.editor.loadError + ': ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, posts, config, isNew, navigate]);

  const handleSave = async () => {
    if (!title || !content) {
      toast.error(t.editor.emptyFields);
      return;
    }

    setSaving(true);
    const loadingToast = toast.loading(t.editor.saving);
    try {
      const postData: Partial<Post> = {
        id: isNew ? Math.random().toString(36).substr(2, 9) : id,
        title,
        excerpt: excerpt || content.substring(0, 150) + '...',
        category,
        date: isNew ? new Date().toISOString() : undefined,
      };
      await onSave(postData, content);
      toast.success(t.editor.saveSuccess, { id: loadingToast });
      setTimeout(() => navigate('/'), 500);
    } catch (err: any) {
      toast.error(t.editor.saveFailed + ': ' + err.message, { id: loadingToast });
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="relative pb-24 md:pb-0">
      {/* 桌面端顶部工具栏 */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="hidden md:flex items-center justify-between mb-6 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)} 
            className="group inline-flex items-center text-sm font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
            {t.editor.cancel}
          </button>
          <div className="h-5 w-[1px] bg-gray-200 dark:bg-gray-700"></div>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full flex items-center">
            <Sparkles size={12} className="mr-1.5" />
            {isNew ? t.editor.newPost || '新文章' : t.editor.editing || '编辑中'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center px-4 py-2 rounded-xl font-bold text-xs transition-all border ${
              previewMode 
                ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {previewMode ? <FileText size={14} className="mr-1.5" /> : <Eye size={14} className="mr-1.5" />}
            {previewMode ? (t.editor.edit || '编辑') : (t.editor.preview || '预览')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-2 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all text-xs"
          >
            {saving ? (
              <div className="w-3 h-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mr-1.5"></div>
            ) : (
              <Save size={14} className="mr-1.5" />
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
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
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

      <div className="max-w-5xl mx-auto">
        {/* 主编辑区 - 全宽设计 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-10"
        >
          {!previewMode ? (
            <div className="space-y-4 md:space-y-6">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.editor.titlePlaceholder}
                className="w-full text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 border-none focus:ring-0 bg-transparent placeholder-gray-300 dark:placeholder-gray-600 outline-none"
              />
              <div className="h-[1px] bg-gray-100 dark:bg-gray-700"></div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t.editor.contentPlaceholder}
                className="w-full min-h-[60vh] md:min-h-[70vh] p-0 text-base md:text-lg leading-relaxed text-gray-700 dark:text-gray-300 border-none focus:ring-0 bg-transparent resize-none placeholder-gray-300 dark:placeholder-gray-600 outline-none"
                style={{ fontFamily: 'inherit' }}
              />
            </div>
          ) : (
            <div className="markdown-content">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 mb-6">
                {title || t.editor.titlePlaceholder}
              </h1>
              <div className="h-[1px] bg-gray-100 dark:bg-gray-700 mb-6"></div>
              <div className="text-gray-700 dark:text-gray-300" style={{ fontSize: '1rem', lineHeight: '1.75' }}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 style={{ fontSize: '1.875rem', fontWeight: '900', color: isDark ? '#f3f4f6' : '#111827', marginTop: '2rem', marginBottom: '1rem', lineHeight: '1.2' }} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f3f4f6' : '#111827', marginTop: '1.5rem', marginBottom: '0.75rem', lineHeight: '1.3' }} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827', marginTop: '1.25rem', marginBottom: '0.5rem', lineHeight: '1.4' }} {...props} />,
                    p: ({node, ...props}) => <p style={{ marginBottom: '1rem', lineHeight: '1.75', color: isDark ? '#d1d5db' : '#374151' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem', listStyleType: 'disc' }} {...props} />,
                    ol: ({node, ...props}) => <ol style={{ marginBottom: '1rem', paddingLeft: '1.5rem', listStyleType: 'decimal' }} {...props} />,
                    li: ({node, ...props}) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
                    blockquote: ({node, ...props}) => <blockquote style={{ borderLeft: `4px solid ${isDark ? '#818cf8' : '#6366f1'}`, paddingLeft: '1rem', fontStyle: 'italic', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '1rem' }} {...props} />,
                    code: ({node, className, children, ...props}) => {
                      const isInline = !className;
                      return isInline ? (
                        <code style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#e5e7eb' : '#1f2937', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.875em', fontFamily: 'monospace' }} {...props}>{children}</code>
                      ) : (
                        <code style={{ display: 'block', backgroundColor: isDark ? '#1f2937' : '#f8fafc', color: isDark ? '#e5e7eb' : '#334155', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '1rem', border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}` }} {...props}>{children}</code>
                      );
                    },
                    pre: ({node, ...props}) => <pre style={{ marginBottom: '1rem' }} {...props} />,
                    a: ({node, ...props}) => <a style={{ color: isDark ? '#818cf8' : '#6366f1', textDecoration: 'underline', fontWeight: '500' }} {...props} />,
                    img: ({node, ...props}) => <img style={{ borderRadius: '0.75rem', boxShadow: isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)', marginTop: '1rem', marginBottom: '1rem', maxWidth: '100%' }} {...props} />,
                    table: ({node, ...props}) => <div style={{ overflowX: 'auto', marginBottom: '1rem' }}><table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} /></div>,
                    th: ({node, ...props}) => <th style={{ border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, padding: '0.5rem', backgroundColor: isDark ? '#1f2937' : '#f9fafb', fontWeight: '600', textAlign: 'left' }} {...props} />,
                    td: ({node, ...props}) => <td style={{ border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, padding: '0.5rem' }} {...props} />,
                    hr: ({node, ...props}) => <hr style={{ border: 'none', borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, marginTop: '1.5rem', marginBottom: '1.5rem' }} {...props} />,
                  }}
                >
                  {content || t.editor.contentPlaceholder}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>

        {/* 桌面端侧边栏设置（可折叠） */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden md:block mt-6"
        >
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Settings size={18} />
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">{t.editor.properties}</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {showSettings ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"
              >
                {/* 分类 */}
                <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                    {t.editor.category}
                  </label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm font-medium"
                  >
                    <option>{t.editor.categories.life}</option>
                    <option>{t.editor.categories.tech}</option>
                    <option>{t.editor.categories.essay}</option>
                    <option>{t.editor.categories.tutorial}</option>
                  </select>
                </div>

                {/* 摘要 */}
                <div className="bg-white dark:bg-gray-700 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 md:col-span-2">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                    {t.editor.excerpt}
                  </label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                    placeholder={t.editor.excerptHint}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm resize-none"
                  />
                </div>

                {/* 统计信息 */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-900 md:col-span-3">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{wordCount}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t.editor.wordCount || '字数'}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{estimatedReadTime}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t.editor.readTime || '分钟'}</div>
                    </div>
                    <div>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">{new Date().toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t.editor.date || '日期'}</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* 移动端底部固定工具栏 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50"
      >
        <div className="flex items-center justify-between p-3">
          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings size={20} />
          </button>

          {/* 统计信息 */}
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>{wordCount} {t.editor.wordCount || '字'}</span>
            <span>•</span>
            <span>{estimatedReadTime} {t.post?.minRead || '分钟'}</span>
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {isNew ? t.editor.publish : t.editor.save}
              </>
            )}
          </button>
        </div>

        {/* 移动端设置面板 */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-gray-50 dark:bg-gray-900"
            >
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                  {t.editor.category}
                </label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm"
                >
                  <option>{t.editor.categories.life}</option>
                  <option>{t.editor.categories.tech}</option>
                  <option>{t.editor.categories.essay}</option>
                  <option>{t.editor.categories.tutorial}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">
                  {t.editor.excerpt}
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={3}
                  placeholder={t.editor.excerptHint}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none text-sm resize-none"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Editor;
