'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, EyeOff, Loader2, RotateCcw, Trash2, X } from 'lucide-react';
import type { ModerationAction } from '@/services/admin-posts';

export interface ModerationDialogTarget {
  action: ModerationAction;
  /** Post ids affected; more than one means a bulk action. */
  postIds: string[];
  /** Title of the single post, for the copy. */
  postTitle?: string;
}

interface ModerationDialogProps {
  target: ModerationDialogTarget | null;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (reason?: string) => void;
}

const COPY: Record<
  ModerationAction,
  {
    title: (count: number) => string;
    body: (count: number, title?: string) => string;
    confirm: (count: number) => string;
    icon: typeof EyeOff;
    tone: 'warning' | 'danger' | 'info';
    askReason: boolean;
  }
> = {
  HIDDEN: {
    title: (n) => (n > 1 ? `Hide ${n} posts?` : 'Hide this post?'),
    body: (n, title) =>
      n > 1
        ? 'Hidden posts disappear from every feed and search result but keep their comments, reactions and bookmarks. Open reports on these posts will be marked resolved. You can restore them later.'
        : `"${title}" will disappear from every feed and search result but keep its comments, reactions and bookmarks. Open reports will be marked resolved. You can restore it later.`,
    confirm: (n) => (n > 1 ? `Hide ${n} posts` : 'Hide Post'),
    icon: EyeOff,
    tone: 'warning',
    askReason: true,
  },
  REMOVE: {
    title: (n) => (n > 1 ? `Delete ${n} posts?` : 'Delete this post?'),
    body: (n, title) =>
      n > 1
        ? 'Deleted posts are removed from the platform for all teachers and their authors are notified. This action cannot be easily undone; an administrator can still restore them from the Deleted filter.'
        : `"${title}" will be removed from the platform for all teachers and the author will be notified. This action cannot be easily undone; an administrator can still restore it from the Deleted filter.`,
    confirm: (n) => (n > 1 ? `Delete ${n} posts` : 'Delete Post'),
    icon: Trash2,
    tone: 'danger',
    askReason: true,
  },
  RESTORE: {
    title: (n) => (n > 1 ? `Restore ${n} posts?` : 'Restore this post?'),
    body: (n, title) =>
      n > 1
        ? 'Restored posts become visible to teachers again. Posts that still have unresolved reports return to the review queue.'
        : `"${title}" will become visible to teachers again. If it still has unresolved reports it returns to the review queue.`,
    confirm: (n) => (n > 1 ? `Restore ${n} posts` : 'Restore Post'),
    icon: RotateCcw,
    tone: 'info',
    askReason: false,
  },
};

const TONE = {
  danger: {
    iconWrap: 'bg-red-100 text-red-600',
    button: 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600/40',
  },
  warning: {
    iconWrap: 'bg-yellow-100 text-yellow-700',
    button: 'bg-[#FFC107] hover:bg-[#FFB300] text-[#043658] focus-visible:ring-[#FFC107]/50',
  },
  info: {
    iconWrap: 'bg-blue-100 text-[#043658]',
    button: 'bg-[#043658] hover:bg-[#05456F] text-white focus-visible:ring-[#043658]/40',
  },
};

export function ModerationDialog({ target, ...rest }: ModerationDialogProps) {
  if (!target) return null;
  // Remounting per target resets the reason field without effects.
  return <ModerationDialogContent key={`${target.action}:${target.postIds.join(',')}`} target={target} {...rest} />;
}

function ModerationDialogContent({
  target,
  isPending,
  onCancel,
  onConfirm,
}: Omit<ModerationDialogProps, 'target'> & { target: ModerationDialogTarget }) {
  const [reason, setReason] = useState('');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    confirmRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isPending, onCancel]);

  const copy = COPY[target.action];
  const tone = TONE[copy.tone];
  const Icon = copy.icon;
  const count = target.postIds.length;

  const dialog = (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={() => !isPending && onCancel()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="fixed left-1/2 top-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.iconWrap}`}>
              <Icon className="h-5 w-5" />
            </div>
            <h3 id={titleId} className="flex-1 text-lg font-bold text-[#043658]">
              {copy.title(count)}
            </h3>
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              aria-label="Close"
              className="text-slate-400 transition-colors hover:text-slate-600 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4 px-6 py-5">
            <p id={descriptionId} className="text-sm leading-relaxed text-slate-600">
              {copy.body(count, target.postTitle)}
            </p>
            {copy.tone === 'danger' && (
              <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Only the post is affected. The author account, community and other posts are untouched.
              </p>
            )}
            {copy.askReason && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">
                  Reason (optional, shared with the author)
                </span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                  disabled={isPending}
                  placeholder="e.g. Violates community guidelines on spam"
                  className="w-full resize-none rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm text-[#043658] placeholder:text-[#6B7C93]/70 focus:border-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 disabled:bg-slate-50"
                />
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={isPending}
              className="rounded-lg border-2 border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={() => onConfirm(reason.trim() || undefined)}
              disabled={isPending}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${tone.button}`}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {copy.confirm(count)}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(dialog, document.body);
}
