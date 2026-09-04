'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  Flag,
  Loader2,
  RefreshCw,
  X,
  XCircle,
} from 'lucide-react';
import SuspendTeacherModal from '@/components/admin/SuspendTeacherModal';
import {
  useAdminPostReports,
  useResolvePostReport,
  type AdminPostReport,
  type AdminPostRow,
  type ReportResolution,
} from '@/services/admin-posts';
import {
  apiErrorMessage,
  formatAdminDateTime,
  fullName,
  initials,
  REPORT_REASON_LABELS,
  REPORT_STATUS_BADGE,
  STATUS_BADGE,
  STATUS_LABELS,
} from './moderation-ui';

interface PostReportsModalProps {
  post: AdminPostRow | null;
  onClose: () => void;
  /** Opens the hide dialog for this post (only offered while the post is still visible). */
  onHidePost: (post: AdminPostRow) => void;
}

export function PostReportsModal({ post, onClose, onHidePost }: PostReportsModalProps) {
  if (!post) return null;
  return <PostReportsModalContent key={post.id} post={post} onClose={onClose} onHidePost={onHidePost} />;
}

function PostReportsModalContent({
  post,
  onClose,
  onHidePost,
}: Omit<PostReportsModalProps, 'post'> & { post: AdminPostRow }) {
  const titleId = useId();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [suspendReportId, setSuspendReportId] = useState<string | undefined>();
  const [busyReportId, setBusyReportId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useAdminPostReports(post.id);
  const resolve = useResolvePostReport();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !suspendOpen) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, suspendOpen]);

  const handleResolve = (report: AdminPostReport, action: ReportResolution) => {
    setBusyReportId(report.id);
    resolve.mutate(
      { postId: post.id, reportId: report.id, action },
      {
        onSuccess: (result: { remainingPendingReports?: number }) => {
          toast.success(action === 'RESOLVE' ? 'Report resolved' : 'Report dismissed');
          if (result?.remainingPendingReports === 0) {
            toast.info('No unresolved reports remain on this post.');
          }
        },
        onError: (error) => toast.error(apiErrorMessage(error, 'Failed to update report')),
        onSettled: () => setBusyReportId(null),
      },
    );
  };

  const reports = data?.reports ?? [];
  const pending = reports.filter((r) => r.status === 'PENDING');
  const currentStatus = data?.post.moderationStatus ?? post.moderationStatus;
  const canHide = currentStatus === 'ACTIVE' || currentStatus === 'REPORTED' || currentStatus === 'UNDER_REVIEW';

  const modal = (
    <>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-x-4 top-1/2 z-[91] mx-auto max-h-[90vh] w-auto max-w-3xl -translate-y-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <Flag className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={titleId} className="text-lg font-bold text-[#043658]">
              Reports for this post
            </h3>
            <p className="mt-0.5 truncate text-sm text-[#6B7C93]" title={post.title}>
              {post.title}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2.5 py-0.5 font-bold ${STATUS_BADGE[currentStatus]}`}>
                {STATUS_LABELS[currentStatus]}
              </span>
              <span className="text-[#6B7C93]">
                {pending.length} unresolved · {reports.length} total
              </span>
              <span className="text-[#6B7C93]">·</span>
              <span className="text-[#6B7C93]">
                Author: <span className="font-semibold text-[#043658]">{fullName(post.teacher)}</span>
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-slate-400 transition-colors hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Post-level actions */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-6 py-3">
          <Link
            href={`/admin/posts/${post.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E2EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#043658] transition-colors hover:bg-[#F8FAFC]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View full post
          </Link>
          {canHide && (
            <button
              type="button"
              onClick={() => onHidePost(post)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100"
            >
              <EyeOff className="h-3.5 w-3.5" />
              Hide content
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSuspendReportId(pending[0]?.id);
              setSuspendOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
          >
            <Ban className="h-3.5 w-3.5" />
            Suspend author
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#6B7C93] transition-colors hover:text-[#043658] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Reports list */}
        <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <ul className="space-y-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="h-24 animate-pulse rounded-xl border border-[#E8EEF3] bg-[#F8FAFC]" />
              ))}
            </ul>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <p className="text-sm font-semibold text-[#043658]">Unable to load reports.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#05456F]"
              >
                Retry
              </button>
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <p className="text-sm font-semibold text-[#043658]">No reports on this post.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {reports.map((report) => {
                const isBusy = busyReportId === report.id;
                const isPending = report.status === 'PENDING';
                return (
                  <li
                    key={report.id}
                    className={`rounded-xl border p-4 ${
                      isPending ? 'border-red-200 bg-red-50/40' : 'border-[#E8EEF3] bg-white'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <ReporterAvatar reporter={report.teacher} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#043658]">{fullName(report.teacher)}</p>
                          <p className="truncate text-xs text-[#6B7C93]">{report.teacher.email}</p>
                          <p className="mt-1 text-xs text-[#6B7C93]">
                            Reported {formatAdminDateTime(report.createdAt)}
                            {report.reviewedAt && ` · Reviewed ${formatAdminDateTime(report.reviewedAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-[#043658] ring-1 ring-[#D9E2EC]">
                          {REPORT_REASON_LABELS[report.reason] ?? report.reason}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${REPORT_STATUS_BADGE[report.status]}`}>
                          {report.status.charAt(0) + report.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {report.description && (
                      <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-sm text-slate-700 ring-1 ring-[#E8EEF3]">
                        {report.description}
                      </p>
                    )}

                    {isPending && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isBusy || resolve.isPending}
                          onClick={() => handleResolve(report, 'RESOLVE')}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy && resolve.variables?.action === 'RESOLVE' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Resolve
                        </button>
                        <button
                          type="button"
                          disabled={isBusy || resolve.isPending}
                          onClick={() => handleResolve(report, 'DISMISS')}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9E2EC] bg-white px-3 py-1.5 text-xs font-semibold text-[#043658] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isBusy && resolve.variables?.action === 'DISMISS' ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSuspendReportId(report.id);
                            setSuspendOpen(true);
                          }}
                          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Suspend author
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <SuspendTeacherModal
        isOpen={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        teacherId={post.teacher.id}
        teacherName={fullName(post.teacher)}
        reportId={suspendReportId}
        onSuccess={() => {
          setSuspendOpen(false);
          toast.success(`${fullName(post.teacher)} has been suspended`);
          refetch();
        }}
      />
    </>
  );

  return createPortal(modal, document.body);
}

function ReporterAvatar({ reporter }: { reporter: AdminPostReport['teacher'] }) {
  if (reporter.profileImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={reporter.profileImage} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">
      {initials(reporter)}
    </div>
  );
}
