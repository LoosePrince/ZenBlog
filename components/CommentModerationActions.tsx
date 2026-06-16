import React from 'react';
import { Check, Loader2, Trash2 } from 'lucide-react';

interface CommentModerationActionsProps {
  commentId: string;
  busyId: string | null;
  onApprove: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  approveLabel: string;
  deleteLabel: string;
  size?: 'sm' | 'md';
}

const CommentModerationActions: React.FC<CommentModerationActionsProps> = ({
  commentId,
  busyId,
  onApprove,
  onDelete,
  approveLabel,
  deleteLabel,
  size = 'sm',
}) => {
  const busy = busyId === commentId;
  const btnClass =
    size === 'md'
      ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50'
      : 'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold disabled:opacity-50';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => onApprove(commentId)}
        className={`${btnClass} bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50`}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        {approveLabel}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => onDelete(commentId)}
        className={`${btnClass} bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50`}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
        {deleteLabel}
      </button>
    </div>
  );
};

export default CommentModerationActions;
