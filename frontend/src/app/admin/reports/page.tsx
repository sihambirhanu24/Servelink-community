'use client';

import { useState, useMemo } from 'react';
import {
  Search, ChevronLeft, ChevronRight, AlertTriangle,
  X, Eye, Trash2, CheckCircle2, XCircle, Shield,
  Flag, Clock, Loader2, Ban, FileText,
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useAdminReports, useResolveReport } from '@/hooks/useAdminReports';
import { toast } from 'sonner';
import SuspendTeacherModal from '@/components/admin/SuspendTeacherModal';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Report {
  id: string;
  reason: string;
  description?: string | null;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reviewedAt?: string | null;
  teacher: { id: string; firstName: string; lastName: string; email: string };
  post: { id: string; title: string; community?: { name: string } | null };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const REASON_LABELS: Record<string, string> = {
  SPAM: 'Spam', ABUSE: 'Abuse', HARASSMENT: 'Harassment',
  MISINFORMATION: 'Misinformation', FAKE_INFORMATION: 'Fake Information', OTHER: 'Other',
};

const REASON_COLORS: Record<string, string> = {
  SPAM:          'bg-blue-100   text-blue-700',
  ABUSE:         'bg-red-100    text-red-700',
  HARASSMENT:    'bg-orange-100 text-orange-700',
  MISINFORMATION:'bg-purple-100 text-purple-700',
  FAKE_INFORMATION:'bg-yellow-100 text-yellow-700',
  OTHER:         'bg-slate-100  text-slate-700',
};

const STATUS_CFG: Record<string, { label: string; dot: string; text: string }> = {
  PENDING:   { label: 'Pending',    dot: 'bg-amber-400',  text: 'text-amber-700'  },
  REVIEWED:  { label: 'Reviewed',   dot: 'bg-blue-400',   text: 'text-blue-700'   },
  RESOLVED:  { label: 'Resolved',   dot: 'bg-green-400',  text: 'text-green-700'  },
  DISMISSED: { label: 'Dismissed',  dot: 'bg-slate-400',  text: 'text-slate-600'  },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Review Modal ─────────────────────────────────────────────────────────────

function ReviewModal({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const { warnMutation, removeMutation, resolveMutation, dismissMutation } =
    useResolveReport();

  const [suspendModalOpen, setSuspendModalOpen] = useState(false);

  const isResolved = report.status === 'RESOLVED' || report.status === 'DISMISSED';

  async function handle(
    action: 'warn' | 'remove' | 'resolve' | 'dismiss',
  ) {
    try {
      if (action === 'warn')    await warnMutation.mutateAsync(report.id);
      if (action === 'remove')  await removeMutation.mutateAsync(report.id);
      if (action === 'resolve') await resolveMutation.mutateAsync(report.id);
      if (action === 'dismiss') await dismissMutation.mutateAsync(report.id);
      toast.success(
        action === 'remove'  ? 'Content removed and reporter notified.' :
        action === 'warn'    ? 'Warning sent to post owner.'            :
        action === 'resolve' ? 'Report resolved. Both parties notified.' :
                               'Report dismissed. Both parties notified.',
      );
      onClose();
    } catch {
      toast.error('Action failed. Please try again.');
    }
  }

  const anyPending =
    warnMutation.isPending || removeMutation.isPending ||
    resolveMutation.isPending || dismissMutation.isPending;

  const statusCfg = STATUS_CFG[report.status] ?? STATUS_CFG.PENDING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Report #{report.id.slice(-8).toUpperCase()}
            </p>
            <h2 className="mt-0.5 text-lg font-bold text-[#043658]">Review Report</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${statusCfg.dot}`} />
            <span className={`text-sm font-semibold ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
            {report.reviewedAt && (
              <span className="text-xs text-slate-400 ml-1">· Reviewed {fmtDate(report.reviewedAt)}</span>
            )}
          </div>

          {/* Post info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Reported Post</p>
            <p className="font-semibold text-[#043658]">{report.post.title}</p>
            {report.post.community && (
              <p className="text-xs text-slate-500 mt-0.5">in {report.post.community.name}</p>
            )}
            <button
              onClick={() => window.location.href = `/admin/posts/${report.post.id}`}
              className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#043658] hover:underline"
            >
              <FileText className="h-3.5 w-3.5" />
              View Full Post
            </button>
          </div>

          {/* Reason + description */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Reason</p>
              <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold ${REASON_COLORS[report.reason] ?? 'bg-slate-100 text-slate-700'}`}>
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Reported on</p>
              <p className="text-sm font-medium text-[#043658]">{fmtDate(report.createdAt)}</p>
            </div>
          </div>

          {report.description && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Details</p>
              <p className="text-sm text-slate-700 leading-relaxed">{report.description}</p>
            </div>
          )}

          {/* Reporter (visible to admin only) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-2">
              Reporter (Admin only — never shown to post owner)
            </p>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">
                {report.teacher.firstName[0]}{report.teacher.lastName[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#043658]">
                  {report.teacher.firstName} {report.teacher.lastName}
                </p>
                <p className="text-xs text-slate-500">{report.teacher.email}</p>
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <Shield className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Notifications sent to both parties will <strong>not</strong> reveal the reporter's identity to the post owner.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        {!isResolved ? (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
            <p className="text-xs text-slate-500 mb-3">Choose an action. Both reporter and post owner will be notified.</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handle('dismiss')}
                disabled={anyPending}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {dismissMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Dismiss
              </button>
              <button
                onClick={() => handle('resolve')}
                disabled={anyPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Resolve
              </button>
              <button
                onClick={() => handle('warn')}
                disabled={anyPending}
                className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                {warnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Warn Owner
              </button>
              <button
                onClick={() => handle('remove')}
                disabled={anyPending}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove Post
              </button>
              <button
                onClick={() => setSuspendModalOpen(true)}
                disabled={anyPending}
                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Suspend Teacher
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end">
            <button onClick={onClose} className="rounded-xl bg-[#043658] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#032742]">
              Close
            </button>
          </div>
        )}
      </div>

      {/* Suspend Teacher Modal */}
      <SuspendTeacherModal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        teacherId={report.teacher.id}
        teacherName={`${report.teacher.firstName} ${report.teacher.lastName}`}
        onSuccess={() => {
          toast.success('Teacher suspended successfully');
          setSuspendModalOpen(false);
          onClose();
        }}
        reportId={report.id}
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12;

export default function AdminReportsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReason, setSelectedReason] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [teacherToSuspend, setTeacherToSuspend] = useState<string | null>(null);

  const { data, isLoading, error } = useAdminReports({
    page: currentPage, pageSize: ITEMS_PER_PAGE,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    reason: selectedReason !== 'all' ? selectedReason : undefined,
    search: searchQuery || undefined,
  });

  const reports: Report[] = data?.data ?? [];
  const meta               = data?.meta;

  const pendingCount   = reports.filter((r) => r.status === 'PENDING').length;
  const resolvedCount  = reports.filter((r) => r.status === 'RESOLVED').length;
  const dismissedCount = reports.filter((r) => r.status === 'DISMISSED').length;

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Header ───────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-[#043658]">Content Moderation</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review reported posts. Reporter identity is never revealed to post owners.
          </p>
        </div>

        {/* ── Summary cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pending',   value: meta?.total ?? '—', color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200', icon: <Clock className="h-5 w-5 text-amber-500" /> },
            { label: 'Resolved',  value: resolvedCount,       color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
            { label: 'Dismissed', value: dismissedCount,      color: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200', icon: <XCircle className="h-5 w-5 text-slate-400" /> },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4 flex items-center gap-3`}>
              {s.icon}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search by post title or reporter…"
              className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Pending',   value: 'PENDING'  },
              { label: 'Resolved',  value: 'RESOLVED' },
              { label: 'Dismissed', value: 'DISMISSED'},
              { label: 'All',       value: 'all'      },
            ].map((b) => (
              <button
                key={b.value}
                onClick={() => { setSelectedStatus(b.value); setCurrentPage(1); }}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedStatus === b.value
                    ? 'border-[#043658] bg-[#043658] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {b.label}
              </button>
            ))}
            <select
              value={selectedReason}
              onChange={(e) => { setSelectedReason(e.target.value); setCurrentPage(1); }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none"
            >
              <option value="all">All Reasons</option>
              {Object.entries(REASON_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Table ────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#043658]" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-sm text-red-600">Failed to load reports.</div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Flag className="h-12 w-12 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-700">No reports found</p>
              <p className="text-xs text-slate-400 mt-1">Try different filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr>
                    {['Post', 'Reason', 'Post Owner', 'Reported', 'Status', 'Action'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((report) => {
                    const sc = STATUS_CFG[report.status] ?? STATUS_CFG.PENDING;
                    return (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Post */}
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-[#043658] line-clamp-1 max-w-[200px]">
                            {report.post.title}
                          </p>
                          {report.post.community && (
                            <p className="text-xs text-slate-400">{report.post.community.name}</p>
                          )}
                        </td>
                        {/* Reason */}
                        <td className="px-4 py-3">
                          <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${REASON_COLORS[report.reason] ?? 'bg-slate-100 text-slate-700'}`}>
                            {REASON_LABELS[report.reason] ?? report.reason}
                          </span>
                        </td>
                        {/* Post Owner (teacher field = reporter; we show post.teacher if available — but API returns teacher=reporter) */}
                        <td className="px-4 py-3">
                          <p className="text-sm text-slate-700">
                            {report.teacher.firstName} {report.teacher.lastName}
                          </p>
                          <p className="text-xs text-slate-400">{report.teacher.email}</p>
                        </td>
                        {/* Date */}
                        <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(report.createdAt)}</td>
                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                            <span className={sc.text}>{sc.label}</span>
                          </span>
                        </td>
                        {/* Action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="flex items-center gap-1.5 rounded-lg border border-[#043658]/20 bg-[#043658]/5 px-3 py-1.5 text-xs font-semibold text-[#043658] hover:bg-[#043658]/10 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3">
              <p className="text-xs text-slate-500">
                Page {meta.page} of {meta.totalPages} · {meta.total} total
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setCurrentPage((p: number) => p + 1)}
                  disabled={currentPage >= meta.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedReport && (
        <ReviewModal report={selectedReport} onClose={() => setSelectedReport(null)} />
      )}
    </AdminLayout>
  );
}
