import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Loader2, Edit3, Trash2, Clock, Share2, AlertTriangle, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CommentStatus, Post, GitHubConfig, Profile, PublicConfig, ZenCommentRecord } from '../types';
import { GitHubService } from '../services/githubService';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useLanguage, useTheme, formatDate } from '../App';
import toast from 'react-hot-toast';
import { parseContentToSegments, getFileRawUrl, type ContentSegment } from '../utils/zenfile';
import FileBlockView from '../components/FileBlockView';
import { UniIdService } from '../services/uniidService';

interface PostDetailProps {
  posts: Post[];
  config: GitHubConfig | null;
  profile: Profile;
  isAdmin: boolean;
  onDelete: (id: string) => Promise<void>;
}

const PostDetail: React.FC<PostDetailProps> = ({ posts, config, profile, isAdmin, onDelete }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { authState } = useAuth();
  const { effectiveTheme } = useTheme();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [author, setAuthor] = useState<{ name: string; avatar: string; username: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [fileTxtPreviews, setFileTxtPreviews] = useState<Record<string, string>>({});
  const [fileProgress, setFileProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  const [comments, setComments] = useState<ZenCommentRecord[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [uniIdConfig, setUniIdConfig] = useState<{ authServer: string; appId: string }>({
    authServer: '',
    appId: '',
  });

  const isDark = effectiveTheme === 'dark';

  const post = posts.find((p) => p.id === id);
  const canComment = authState.isUniIdAuthed;

  const commentRoots = useMemo(
    () =>
      comments.filter(
        (c) =>
          c.data.depth === 0 &&
          (c.data.status === 'approved' || (isAdmin && c.data.status === 'pending'))
      ),
    [comments, isAdmin]
  );

  const getReplies = (rootId: string) =>
    comments.filter(
      (c) =>
        c.data.depth === 1 &&
        c.data.rootCommentId === rootId &&
        (c.data.status === 'approved' || (isAdmin && c.data.status === 'pending'))
    );

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!post || !config) {
      if (!post && !loading) setError(t.post.notFound);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      try {
        const service = new GitHubService(config);
        const { content } = await service.getFile(post.contentPath);
        setContent(content);
        
        // 获取文章作者信息
        const authorInfo = await service.getFileAuthor(post.contentPath);
        setAuthor(authorInfo);
      } catch (err: any) {
        setError(err.message || t.post.loadError);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id, post, config, t]);

  useEffect(() => {
    const loadPublicConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) return;
        const cfg: PublicConfig = await response.json();
        if (cfg.uniid?.authServer && cfg.uniid?.appId) {
          setUniIdConfig({ authServer: cfg.uniid.authServer, appId: cfg.uniid.appId });
        }
      } catch {}
    };
    loadPublicConfig();
  }, []);

  const segments = useMemo(() => parseContentToSegments(content), [content]);

  useEffect(() => {
    if (!config || !post) {
      setFileProgress({ loaded: 0, total: 0 });
      return;
    }
    const fileSegments = segments.filter((s): s is ContentSegment & { type: 'file' } => s.type === 'file');
    if (fileSegments.length === 0) {
      setFileProgress({ loaded: 0, total: 0 });
      return;
    }
    const service = new GitHubService(config);
    const owner = config.owner;
    const repo = config.repo;
    const branch = config.branch || 'data';
    let cancelled = false;
    const load = async () => {
      const urls: Record<string, string> = {};
      const txtPreviews: Record<string, string> = {};
      setFileProgress({ loaded: 0, total: fileSegments.length });
      let loaded = 0;
      for (const seg of fileSegments) {
        if (cancelled) break;
        const { uuid, mime } = seg.value;
        if (uuid.startsWith('local-')) continue;
        try {
          const path = `data/files/${uuid}`;
          // 优先使用 GitHub raw URL，保证音频/视频正常支持 Range 与时长
          urls[uuid] = getFileRawUrl(owner, repo, branch, path);
          if (mime === 'text/plain') {
            const { contentBase64 } = await service.getFileAsBase64(path);
            const binary = Uint8Array.from(atob(contentBase64), (c) => c.charCodeAt(0));
            const text = new TextDecoder().decode(binary).slice(0, 1024);
            txtPreviews[uuid] = text;
          }
        } catch {
          // leave url empty, FileBlockView will show placeholder
        } finally {
          loaded += 1;
          setFileProgress((prev) =>
            prev.total === 0 ? prev : { loaded: Math.min(loaded, prev.total), total: prev.total }
          );
        }
      }
      if (!cancelled) {
        setFileUrls((prev) => {
          Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
          return urls;
        });
        setFileTxtPreviews(txtPreviews);
        setFileProgress((prev) => ({ loaded: prev.total, total: prev.total }));
      }
    };
    load();
    return () => {
      cancelled = true;
      setFileUrls((prev) => {
        Object.values(prev).forEach((url) => URL.revokeObjectURL(url));
        return {};
      });
      setFileProgress({ loaded: 0, total: 0 });
    };
  }, [config, post, segments]);

  const loadComments = async () => {
    if (!post?.id) return;
    setCommentLoading(true);
    try {
      const service = new UniIdService(uniIdConfig);
      await service.ensureCommentSchema();
      const list = await service.listComments(post.id, { includePending: isAdmin });
      setComments(list);
    } catch (err: any) {
      toast.error(`${t.comment.loadFailed}: ${err.message || 'unknown error'}`);
    } finally {
      setCommentLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post?.id, uniIdConfig.authServer, uniIdConfig.appId, isAdmin]);

  const submitComment = async (content: string, parent?: ZenCommentRecord) => {
    if (!post?.id) return;
    if (!canComment || !authState.uniIdUser?.id) {
      toast.error(t.comment.loginRequired);
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      toast.error(t.comment.empty);
      return;
    }
    if (trimmed.length > 1000) {
      toast.error(t.comment.tooLong);
      return;
    }
    const depth: 0 | 1 = parent ? 1 : 0;
    const rootCommentId = parent ? (parent.data.depth === 0 ? parent.id : parent.data.rootCommentId) : null;
    const parentCommentId = parent ? parent.id : null;

    setCommentSubmitting(true);
    try {
      const service = new UniIdService(uniIdConfig);
      await service.createComment({
        postId: post.id,
        content: trimmed,
        userId: authState.uniIdUser.id,
        username: authState.uniIdUser.username || 'user',
        parentCommentId,
        rootCommentId,
        depth,
      });
      toast.success(t.comment.submitSuccess);
      setNewComment('');
      setReplyText('');
      setReplyingTo(null);
      await loadComments();
    } catch (err: any) {
      toast.error(`${t.comment.submitFailed}: ${err.message || 'unknown error'}`);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const reviewComment = async (commentId: string, status: CommentStatus) => {
    setCommentSubmitting(true);
    try {
      const service = new UniIdService(uniIdConfig);
      await service.updateCommentStatus(commentId, status);
      toast.success(status === 'approved' ? t.comment.approveSuccess : t.comment.rejectSuccess);
      await loadComments();
    } catch (err: any) {
      toast.error(`${t.comment.reviewFailed}: ${err.message || 'unknown error'}`);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (id) {
      setShowDeleteModal(false);
      await onDelete(id);
      navigate('/');
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title || 'ZenBlog';
    const text = post?.excerpt || '';

    // 尝试使用 Web Share API
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
        toast.success(t.post?.shareSuccess || '分享成功！');
      } catch (err) {
        // 用户取消分享
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // 降级方案：复制链接
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t.post?.linkCopied || '链接已复制到剪贴板！');
      } catch (err) {
        console.error('Copy failed:', err);
        toast.error(t.post?.copyFailed || '复制失败');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-48">
        <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">{t.post.fetchingStory}</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="text-center py-32 bg-white dark:bg-gray-800 rounded-[3rem] shadow-sm border border-gray-100 dark:border-gray-700 max-w-2xl mx-auto">
        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-6">{error || t.post.error404}</h2>
        <Link to="/" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest text-sm hover:opacity-70 transition-opacity">
          <ArrowLeft size={16} className="mr-2" /> {t.post.backHome}
        </Link>
      </div>
    );
  }

  const readingTime = Math.ceil(content.length / 500) || 1;
  const mdComponents: Parameters<typeof ReactMarkdown>[0]['components'] = {
    h1: (props) => <h1 style={{ fontSize: '1.75rem', fontWeight: '900', color: isDark ? '#f3f4f6' : '#111827', marginTop: '2rem', marginBottom: '1rem', lineHeight: '1.2' }} {...props} />,
    h2: (props) => <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: isDark ? '#f3f4f6' : '#111827', marginTop: '1.75rem', marginBottom: '0.875rem', lineHeight: '1.3' }} {...props} />,
    h3: (props) => <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: isDark ? '#e5e7eb' : '#111827', marginTop: '1.5rem', marginBottom: '0.75rem', lineHeight: '1.4' }} {...props} />,
    p: (props) => <p style={{ marginBottom: '1.25rem', lineHeight: '1.75' }} {...props} />,
    ul: (props) => <ul style={{ marginBottom: '1.25rem', paddingLeft: '1.5rem', listStyleType: 'disc' }} {...props} />,
    ol: (props) => <ol style={{ marginBottom: '1.25rem', paddingLeft: '1.5rem', listStyleType: 'decimal' }} {...props} />,
    li: (props) => <li style={{ marginBottom: '0.5rem' }} {...props} />,
    blockquote: (props) => <blockquote style={{ borderLeft: `4px solid ${isDark ? '#818cf8' : '#6366f1'}`, paddingLeft: '1rem', fontStyle: 'italic', color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '1.25rem' }} {...props} />,
    code: ({ className, children, ...props }) => {
      const isInline = !className;
      return isInline ? (
        <code style={{ backgroundColor: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#e5e7eb' : '#1f2937', padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.875em', fontFamily: 'monospace' }} {...props}>{children}</code>
      ) : (
        <code style={{ display: 'block', backgroundColor: isDark ? '#1f2937' : '#f8fafc', color: isDark ? '#e5e7eb' : '#334155', padding: '1rem', borderRadius: '0.5rem', overflow: 'auto', fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '1.25rem', border: `1px solid ${isDark ? '#374151' : '#e2e8f0'}` }} {...props}>{children}</code>
      );
    },
    pre: (props) => <pre style={{ marginBottom: '1.25rem' }} {...props} />,
    a: (props) => <a style={{ color: isDark ? '#818cf8' : '#6366f1', textDecoration: 'underline', fontWeight: '500' }} {...props} />,
    img: (props) => <img style={{ borderRadius: '1rem', boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', marginTop: '1.5rem', marginBottom: '1.5rem', maxWidth: '100%' }} {...props} />,
    table: (props) => <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}><table style={{ width: '100%', borderCollapse: 'collapse' }} {...props} /></div>,
    th: (props) => <th style={{ border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, padding: '0.75rem', backgroundColor: isDark ? '#1f2937' : '#f9fafb', fontWeight: '600', textAlign: 'left' }} {...props} />,
    td: (props) => <td style={{ border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, padding: '0.75rem' }} {...props} />,
    hr: (props) => <hr style={{ border: 'none', borderTop: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, marginTop: '2rem', marginBottom: '2rem' }} {...props} />,
  };

  return (
    <article className="max-w-4xl mx-auto">
      <div className="mb-8 md:mb-12">
        <Link to="/" className="group inline-flex items-center text-sm font-black text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> {t.post.back}
        </Link>
      </div>

      <header className="mb-12 md:mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-6">
            <span className="px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-widest">
              {post.category}
            </span>
            <div className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
            <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-tight">
              <Calendar size={14} className="mr-1.5" />
              <span className="hidden sm:inline">{formatDate(post.date, 'full', language)}</span>
              <span className="sm:hidden">{formatDate(post.date, 'short', language)}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-200 dark:bg-gray-700"></div>
            <div className="flex items-center text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-tight">
              <Clock size={14} className="mr-1.5" />
              {readingTime} {t.post.minRead}
            </div>
          </div>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100 mb-8 md:mb-10 leading-[1.1] tracking-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between gap-3 md:gap-4 pb-8 md:pb-10 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-3 md:space-x-4 min-w-0 flex-1">
              <img 
                src={author?.avatar || profile.avatar} 
                alt={author?.name || profile.name}
                className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-700 flex-shrink-0" 
              />
              <div className="min-w-0">
                <p className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{author?.name || profile.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tight truncate">
                  {author?.username ? `@${author.username}` : t.post.adminMember}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
              {isAdmin && (
                <>
                  <Link 
                    to={`/edit/${post.id}`}
                    className="p-2 md:p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all transform hover:scale-105"
                  >
                    <Edit3 size={18} className="md:w-5 md:h-5" />
                  </Link>
                  <button 
                    onClick={handleDeleteClick}
                    className="p-2 md:p-2.5 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-all transform hover:scale-105"
                  >
                    <Trash2 size={18} className="md:w-5 md:h-5" />
                  </button>
                </>
              )}
              <button 
                onClick={handleShare}
                className="p-2 md:p-2.5 border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all transform hover:scale-105"
                title={t.post?.share || '分享文章'}
              >
                <Share2 size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="markdown-content"
        style={{
          fontSize: '1.125rem',
          lineHeight: '1.75',
          color: isDark ? '#9ca3af' : '#4b5563',
        }}
      >
        {fileProgress.total > 0 && fileProgress.loaded < fileProgress.total && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <span>
              附件加载中 ({fileProgress.loaded}/{fileProgress.total})
            </span>
          </div>
        )}
        {segments.map((seg, index) =>
          seg.type === 'markdown' ? (
            <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={mdComponents}>
              {seg.value}
            </ReactMarkdown>
          ) : (
            <FileBlockView
              key={index}
              block={seg.value}
              fileUrl={fileUrls[seg.value.uuid] ?? null}
              txtPreview={seg.value.mime === 'text/plain' ? (fileTxtPreviews[seg.value.uuid] ?? null) : undefined}
            />
          )
        )}
      </motion.div>

      <footer className="mt-16 md:mt-20 pt-10 border-t border-gray-100 dark:border-gray-800">
        <section className="mb-10 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 md:p-8">
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-4">{t.comment.title}</h3>
          {!canComment ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.comment.loginHint}{' '}
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold">
                {t.comment.goLogin}
              </Link>
            </div>
          ) : (
            <div className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                placeholder={t.comment.placeholder}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  disabled={commentSubmitting}
                  onClick={() => submitComment(newComment)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-50"
                >
                  {t.comment.submit}
                </button>
              </div>
            </div>
          )}

          {commentLoading ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t.comment.loading}</p>
          ) : commentRoots.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t.comment.emptyList}</p>
          ) : (
            <div className="space-y-4">
              {commentRoots.map((comment) => {
                const replies = getReplies(comment.id);
                return (
                  <div key={comment.id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                        {comment.data.author.username}
                      </p>
                      <div className="flex items-center gap-2">
                        {comment.data.status === 'pending' && (
                          <span className="text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            {t.comment.pending}
                          </span>
                        )}
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(comment.data.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.data.content}</p>
                    <div className="mt-2 flex gap-2">
                      {canComment && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo(replyingTo === comment.id ? null : comment.id);
                            setReplyText('');
                          }}
                          className="text-xs text-indigo-600 dark:text-indigo-400 font-bold"
                        >
                          {t.comment.reply}
                        </button>
                      )}
                      {isAdmin && comment.data.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            disabled={commentSubmitting}
                            onClick={() => reviewComment(comment.id, 'approved')}
                            className="text-xs text-green-600 dark:text-green-400 font-bold"
                          >
                            {t.comment.approve}
                          </button>
                          <button
                            type="button"
                            disabled={commentSubmitting}
                            onClick={() => reviewComment(comment.id, 'rejected')}
                            className="text-xs text-red-600 dark:text-red-400 font-bold"
                          >
                            {t.comment.reject}
                          </button>
                        </>
                      )}
                    </div>
                    {replyingTo === comment.id && canComment && (
                      <div className="mt-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={2}
                          placeholder={t.comment.replyPlaceholder}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        />
                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="text-xs px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600"
                          >
                            {t.common.cancel}
                          </button>
                          <button
                            type="button"
                            disabled={commentSubmitting}
                            onClick={() => submitComment(replyText, comment)}
                            className="text-xs px-3 py-1 rounded-lg bg-indigo-600 text-white disabled:opacity-50"
                          >
                            {t.comment.submitReply}
                          </button>
                        </div>
                      </div>
                    )}
                    {replies.length > 0 && (
                      <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                        {replies.map((reply) => (
                          <div key={reply.id} className="rounded-xl bg-gray-50 dark:bg-gray-900 p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{reply.data.author.username}</p>
                              <div className="flex items-center gap-2">
                                {reply.data.status === 'pending' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                    {t.comment.pending}
                                  </span>
                                )}
                                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                  {new Date(reply.data.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.data.content}</p>
                            {isAdmin && reply.data.status === 'pending' && (
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  disabled={commentSubmitting}
                                  onClick={() => reviewComment(reply.id, 'approved')}
                                  className="text-[10px] text-green-600 dark:text-green-400 font-bold"
                                >
                                  {t.comment.approve}
                                </button>
                                <button
                                  type="button"
                                  disabled={commentSubmitting}
                                  onClick={() => reviewComment(reply.id, 'rejected')}
                                  className="text-[10px] text-red-600 dark:text-red-400 font-bold"
                                >
                                  {t.comment.reject}
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h4 className="text-xl font-black text-gray-900 dark:text-gray-100 mb-2 italic">{t.post.enjoyed}</h4>
            <p className="text-gray-400 dark:text-gray-500 font-medium text-sm md:text-base">{t.post.follow}</p>
          </div>
          <Link to="/" className="w-full md:w-auto text-center px-8 py-4 bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded-[1.5rem] font-black shadow-sm hover:shadow-md transition-all active:scale-95 tracking-widest uppercase text-xs">
            {t.post.allPosts}
          </Link>
        </div>
      </footer>

      {/* 删除确认模态窗口 */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDeleteCancel}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* 模态窗口 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              >
                {/* 头部 */}
                <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 px-6 py-5 border-b border-red-100 dark:border-red-900/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl">
                      <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
                      {t.post.deleteTitle || '确认删除'}
                    </h3>
                  </div>
                  <button
                    onClick={handleDeleteCancel}
                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                {/* 内容 */}
                <div className="px-6 py-6">
                  <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-2">
                    {t.post.deleteConfirm || '确定要删除这篇文章吗？'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    此操作无法撤销，文章将被永久删除。
                  </p>
                </div>

                {/* 底部按钮 */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-6 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    {t.common.cancel || '取消'}
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-6 py-2.5 bg-red-500 dark:bg-red-600 text-white rounded-xl font-bold hover:bg-red-600 dark:hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Trash2 size={16} />
                    <span>{t.common.delete || '删除'}</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </article>
  );
};

export default PostDetail;
