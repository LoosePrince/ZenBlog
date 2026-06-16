import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import CommentModerationActions from '../components/CommentModerationActions';
import { useLanguage } from '../App';
import { UniIdService } from '../services/uniidService';
import { Post, PublicConfig, ZenCommentRecord } from '../types';

interface CommentModerationProps {
  posts: Post[];
}

const CommentModeration: React.FC<CommentModerationProps> = ({ posts }) => {
  const { t, language } = useLanguage();
  const [uniIdConfig, setUniIdConfig] = useState<{ url: string; appId: string }>({ url: '', appId: '' });
  const [comments, setComments] = useState<ZenCommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const isReady = Boolean(uniIdConfig.url && uniIdConfig.appId);

  const postTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const post of posts) {
      map.set(post.id, post.title);
    }
    return map;
  }, [posts]);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('/config.json');
        if (!response.ok) return;
        const cfg: PublicConfig = await response.json();
        if (cfg.uniid?.url && cfg.uniid?.appId) {
          setUniIdConfig({ url: cfg.uniid.url, appId: cfg.uniid.appId });
        }
      } catch {
        // ignore
      }
    };
    loadConfig();
  }, []);

  const loadPending = useCallback(async () => {
    if (!isReady) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const service = new UniIdService(uniIdConfig);
      const list = await service.listPendingComments();
      setComments(list);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error';
      toast.error(`${t.comment.moderation.loadFailed}: ${message}`);
    } finally {
      setLoading(false);
    }
  }, [isReady, uniIdConfig, t.comment.moderation.loadFailed]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const approveComment = async (commentId: string) => {
    if (!isReady) return;
    setBusyId(commentId);
    try {
      const service = new UniIdService(uniIdConfig);
      await service.updateCommentStatus(commentId, 'approved');
      toast.success(t.comment.approveSuccess);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error';
      toast.error(`${t.comment.reviewFailed}: ${message}`);
    } finally {
      setBusyId(null);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!isReady) return;
    setBusyId(commentId);
    try {
      const service = new UniIdService(uniIdConfig);
      await service.deleteComment(commentId);
      toast.success(t.comment.deleteSuccess);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown error';
      toast.error(`${t.comment.deleteFailed}: ${message}`);
    } finally {
      setBusyId(null);
    }
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/"
            className="group mb-4 inline-flex items-center text-sm font-black uppercase tracking-widest text-gray-400 transition-colors hover:text-indigo-600 dark:text-gray-500 dark:hover:text-indigo-400"
          >
            <ArrowLeft size={16} className="mr-2 transition-transform group-hover:-translate-x-1" />
            {t.comment.moderation.back}
          </Link>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">{t.comment.moderation.title}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t.comment.moderation.description}</p>
        </div>
        <button
          type="button"
          onClick={loadPending}
          disabled={loading || !isReady}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {t.comment.moderation.refresh}
        </button>
      </div>

      {!isReady ? (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200">
          {t.comment.moderation.configMissing}
        </div>
      ) : loading ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t.comment.loading}</p>
      ) : comments.length === 0 ? (
        <div className="rounded-3xl border border-gray-100 bg-white p-10 text-center dark:border-gray-700 dark:bg-gray-800">
          <MessageSquare className="mx-auto mb-4 text-gray-300 dark:text-gray-600" size={40} />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.comment.moderation.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
            {t.comment.moderation.pendingCount.replace('{count}', String(comments.length))}
          </p>
          {comments.map((comment) => {
            const postTitle = postTitleById.get(comment.data.postId) ?? comment.data.postId;
            const isReply = comment.data.depth === 1;
            return (
              <article
                key={comment.id}
                className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-sm dark:border-amber-900/30 dark:bg-gray-800"
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                        {comment.data.author.username}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        {t.comment.pending}
                      </span>
                      {isReply && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                          {t.comment.moderation.replyBadge}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{formatTime(comment.data.createdAt)}</p>
                  </div>
                  <Link
                    to={`/post/${comment.data.postId}`}
                    className="text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {t.comment.moderation.viewPost}: {postTitle}
                  </Link>
                </div>
                <p className="mb-4 whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {comment.data.content}
                </p>
                <CommentModerationActions
                  commentId={comment.id}
                  busyId={busyId}
                  onApprove={approveComment}
                  onDelete={deleteComment}
                  approveLabel={t.comment.moderation.approveShow}
                  deleteLabel={t.comment.moderation.deleteRemove}
                  size="md"
                />
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentModeration;
