'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/layout';
import {
  Megaphone, Plus, Search, Eye, Pencil, Trash2, Send, EyeOff,
  Loader2, FileText, X, ChevronLeft, ChevronRight, Users,
  AlertTriangle, Zap, BookOpen, Settings, Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminAnnouncements,
  useAdminAnnouncementSummary,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
  usePublishAnnouncement,
  useUnpublishAnnouncement,
  useAdminAnnouncement,
} from '@/hooks/useAnnouncements';
import type {
  Announcement,
  AnnouncementType,
  AnnouncementTarget,
  CreateAnnouncementPayload,
  UpdateAnnouncementPayload,
} from '@/services/announcements';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/axios';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, { label: string; colour: string; bg: string; icon: React.ReactNode }> = {
  GENERAL:          { label: 'General',          colour: 'text-slate-700',  bg: 'bg-slate-100',  icon: <Bell      className="w-3.5 h-3.5" /> },
  IMPORTANT:        { label: 'Important',        colour: 'text-blue-700',   bg: 'bg-blue-100',   icon: <BookOpen  className="w-3.5 h-3.5" /> },
  URGENT:           { label: 'Urgent',           colour: 'text-red-700',    bg: 'bg-red-100',    icon: <Zap       className="w-3.5 h-3.5" /> },
  COMMUNITY_UPDATE: { label: 'Community Update', colour: 'text-green-700',  bg: 'bg-green-100',  icon: <Users     className="w-3.5 h-3.5" /> },
  SYSTEM_UPDATE:    { label: 'System Update',    colour: 'text-purple-700', bg: 'bg-purple-100', icon: <Settings  className="w-3.5 h-3.5" /> },
};

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  ALL_TEACHERS: 'All Teachers',
  SCHOOL:       'School Community',
  WOREDA:       'Woreda Community',
  ZONE:         'Zone Community',
  REGION:       'Region Community',
  NATIONAL:     'National Community',
};

const COMMUNITY_TARGETS: AnnouncementTarget[] = ['SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AnnouncementType }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.GENERAL;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.colour}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'PUBLISHED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />Published
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Draft
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading,
}: {
  title: string; message: string; confirmLabel: string; confirmClass: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
        <div className="p-6">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm text-slate-500">{message}</p>
        </div>
        <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
          <button onClick={onCancel} className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${confirmClass}`}>
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Announcement form modal ──────────────────────────────────────────────────

function AnnouncementFormModal({
  editId,
  onClose,
}: {
  editId: string | null;
  onClose: () => void;
}) {
  const isEditing = !!editId;
  const { data: existing, isLoading: loadingExisting } = useAdminAnnouncement(editId);

  const { data: communitiesData } = useQuery({
    queryKey: ['admin-communities-for-announcement'],
    queryFn: async () => {
      const { data } = await adminApi.get('/admin/communities?pageSize=200');
      return data;
    },
  });

  const communities: any[] = communitiesData?.data ?? [];

  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const publishMutation = usePublishAnnouncement();

  const [form, setForm] = useState<{
    title: string;
    content: string;
    type: AnnouncementType;
    targetAudience: AnnouncementTarget;
    communityId: string;
    file: File | null;
  }>({
    title:          '',
    content:        '',
    type:           'GENERAL',
    targetAudience: 'ALL_TEACHERS',
    communityId:    '',
    file:           null,
  });
  const [formInit, setFormInit] = useState(false);

  // Populate form when editing
  if (isEditing && existing && !formInit) {
    setFormInit(true);
    setForm({
      title:          existing.title,
      content:        existing.content,
      type:           existing.type,
      targetAudience: existing.targetAudience,
      communityId:    existing.communityId ?? '',
      file:           null,
    });
  }

  function set(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const needsCommunity = COMMUNITY_TARGETS.includes(form.targetAudience);
  const filteredCommunities = communities.filter((c: any) =>
    c.type === form.targetAudience,
  );

  const isPending = createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  async function handleSubmit(publish: boolean) {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (needsCommunity && !form.communityId) {
      toast.error('Please select a community for this target audience');
      return;
    }

    try {
      const payload: CreateAnnouncementPayload = {
        title:          form.title.trim(),
        content:        form.content.trim(),
        type:           form.type,
        targetAudience: form.targetAudience,
        communityId:    needsCommunity ? form.communityId : undefined,
        file:           form.file ?? undefined,
      };

      if (isEditing) {
        await updateMutation.mutateAsync({ id: editId!, payload });
        toast.success('Announcement updated');
      } else {
        // Create the announcement first
        const created = await createMutation.mutateAsync(payload);
        
        // If publish is true, publish it immediately
        if (publish && created?.id) {
          await publishMutation.mutateAsync(created.id);
          toast.success('Announcement created and published');
        } else {
          toast.success('Draft saved');
        }
      }
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Failed to save announcement');
    }
  }

  if (isEditing && loadingExisting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[#043658]">
              {isEditing ? 'Edit Announcement' : 'Create Announcement'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Update the announcement details below.' : 'Fill in the details to create a new announcement.'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Title <span className="text-red-500">*</span></label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={200}
              placeholder="Enter announcement title…"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">{form.title.length}/200</p>
          </div>

          {/* Type + Target row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Announcement Type</label>
              <select
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
              >
                {Object.entries(TYPE_CONFIG).map(([val, cfg]) => (
                  <option key={val} value={val}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Target Audience</label>
              <select
                value={form.targetAudience}
                onChange={(e) => { set('targetAudience', e.target.value); set('communityId', ''); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
              >
                {Object.entries(TARGET_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Community selector */}
          {needsCommunity && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Community <span className="text-red-500">*</span>
              </label>
              {filteredCommunities.length === 0 ? (
                <p className="text-xs text-slate-400 rounded-lg border border-slate-200 px-3 py-2.5">
                  No {form.targetAudience.toLowerCase()} communities found.
                </p>
              ) : (
                <select
                  value={form.communityId}
                  onChange={(e) => set('communityId', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
                >
                  <option value="">Select community…</option>
                  {filteredCommunities.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Content */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Content <span className="text-red-500">*</span></label>
            <textarea
              value={form.content}
              onChange={(e) => set('content', e.target.value)}
              rows={6}
              placeholder="Write the announcement content…"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>

          {/* Attachment */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Attachment (optional)</label>
            <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-4 hover:bg-slate-100 transition-colors">
              <FileText className="mb-1.5 h-5 w-5 text-slate-400" />
              <p className="text-xs text-slate-600">
                <span className="font-semibold text-[#043658]">Click to upload</span> or drag and drop
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">PDF, DOCX, JPG, PNG (max 10 MB)</p>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => set('file', e.target.files?.[0] ?? null)}
              />
            </label>
            {form.file && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-emerald-700 font-medium">{form.file.name}</span>
                <button onClick={() => set('file', null)} className="text-slate-400 hover:text-red-500">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {!form.file && existing?.attachmentName && (
              <p className="mt-1 text-xs text-slate-500">Current: {existing.attachmentName}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-slate-100 px-6 py-4 shrink-0">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg border border-[#043658]/30 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-slate-100 disabled:opacity-60"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Save Draft'}
          </button>
          {!isEditing && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Send className="h-3.5 w-3.5" />
              Publish Announcement
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminAnnouncementsPage() {
  const [page, setPage]             = useState(1);
  const [statusFilter, setStatus]   = useState<string>('');
  const [search, setSearch]         = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId]         = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete]     = useState<Announcement | null>(null);
  const [confirmPublish, setConfirmPublish]   = useState<Announcement | null>(null);
  const [confirmUnpublish, setConfirmUnpublish] = useState<Announcement | null>(null);

  const { data, isLoading } = useAdminAnnouncements({ page, pageSize: 15, status: statusFilter || undefined, search: search || undefined });
  const { data: summary }   = useAdminAnnouncementSummary();

  const deleteMutation   = useDeleteAnnouncement();
  const publishMutation  = usePublishAnnouncement();
  const unpublishMutation = useUnpublishAnnouncement();

  const announcements = data?.data ?? [];
  const meta          = data?.meta;

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      await deleteMutation.mutateAsync(confirmDelete.id);
      toast.success('Announcement deleted');
    } catch { toast.error('Failed to delete'); }
    finally   { setConfirmDelete(null); }
  }

  async function handlePublish() {
    if (!confirmPublish) return;
    try {
      await publishMutation.mutateAsync(confirmPublish.id);
      toast.success('Announcement published');
    } catch { toast.error('Failed to publish'); }
    finally   { setConfirmPublish(null); }
  }

  async function handleUnpublish() {
    if (!confirmUnpublish) return;
    try {
      await unpublishMutation.mutateAsync(confirmUnpublish.id);
      toast.success('Announcement unpublished');
    } catch { toast.error('Failed to unpublish'); }
    finally   { setConfirmUnpublish(null); }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#043658]">Announcements</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create and manage announcements for teachers across ServeLink.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#032742] transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Create Announcement
          </button>
        </div>

        {/* ── Summary cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Published',    value: summary?.published ?? '—', colour: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200' },
            { label: 'Drafts',       value: summary?.draft     ?? '—', colour: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-200' },
            { label: 'Total',        value: (summary ? (summary.published + summary.draft) : '—'), colour: 'text-[#043658]', bg: 'bg-slate-50', border: 'border-slate-200' },
            { label: 'Recent (7d)',  value: summary?.recent?.length ?? '—', colour: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.colour}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search announcements…"
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['', 'PUBLISHED', 'DRAFT'] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                  statusFilter === s
                    ? 'border-[#043658] bg-[#043658] text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === '' ? 'All' : s === 'PUBLISHED' ? 'Published' : 'Drafts'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#043658]" />
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Megaphone className="mb-3 h-12 w-12 text-slate-200" />
              <p className="text-sm font-semibold text-slate-700">No announcements yet</p>
              <p className="mt-1 text-xs text-slate-400">
                {search || statusFilter ? 'Try different filters.' : 'Click "+ Create Announcement" to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/60">
                  <tr>
                    {['Title', 'Type', 'Target', 'Status', 'Reads', 'Created', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {announcements.map((ann) => (
                    <tr key={ann.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[#043658] line-clamp-1">{ann.title}</p>
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{ann.content.slice(0, 60)}…</p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={ann.type} /></td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-600">{TARGET_LABELS[ann.targetAudience]}</span>
                        {ann.community && (
                          <p className="text-[10px] text-slate-400 mt-0.5">{ann.community.name}</p>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={ann.status} /></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{ann._count?.reads ?? 0}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-500">{ann.createdByName}</p>
                        <p className="text-[10px] text-slate-400">{timeAgo(ann.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* Edit */}
                          <button
                            onClick={() => setEditId(ann.id)}
                            title="Edit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#043658] transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Publish / Unpublish */}
                          {ann.status === 'DRAFT' ? (
                            <button
                              onClick={() => setConfirmPublish(ann)}
                              title="Publish"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmUnpublish(ann)}
                              title="Unpublish"
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                            >
                              <EyeOff className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete(ann)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {(showCreate || editId) && (
        <AnnouncementFormModal
          editId={editId}
          onClose={() => { setShowCreate(false); setEditId(null); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Announcement"
          message={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          confirmClass="bg-red-600 hover:bg-red-700"
          loading={deleteMutation.isPending}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmPublish && (
        <ConfirmDialog
          title="Publish Announcement"
          message={`Publish "${confirmPublish.title}"? It will become visible to the target audience immediately.`}
          confirmLabel="Publish"
          confirmClass="bg-green-600 hover:bg-green-700"
          loading={publishMutation.isPending}
          onConfirm={handlePublish}
          onCancel={() => setConfirmPublish(null)}
        />
      )}

      {confirmUnpublish && (
        <ConfirmDialog
          title="Unpublish Announcement"
          message={`Unpublish "${confirmUnpublish.title}"? It will be hidden from teachers and moved back to drafts.`}
          confirmLabel="Unpublish"
          confirmClass="bg-amber-600 hover:bg-amber-700"
          loading={unpublishMutation.isPending}
          onConfirm={handleUnpublish}
          onCancel={() => setConfirmUnpublish(null)}
        />
      )}
    </AdminLayout>
  );
}
