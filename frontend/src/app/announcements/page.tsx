'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Megaphone, Bell, BookOpen, Zap, Users, Settings,
  ChevronLeft, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useTeacherAnnouncements, useMarkAnnouncementRead } from '@/hooks/useAnnouncements';
import type { Announcement, AnnouncementType } from '@/services/announcements';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, { label: string; colour: string; bg: string; border: string; accent: string }> = {
  GENERAL:          { label: 'General',          colour: 'text-slate-700',  bg: 'bg-slate-50',  border: 'border-slate-200',  accent: 'border-l-slate-400'  },
  IMPORTANT:        { label: 'Important',        colour: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',   accent: 'border-l-blue-500'   },
  URGENT:           { label: 'Urgent',           colour: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    accent: 'border-l-red-500'    },
  COMMUNITY_UPDATE: { label: 'Community Update', colour: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  accent: 'border-l-green-500'  },
  SYSTEM_UPDATE:    { label: 'System Update',    colour: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200', accent: 'border-l-purple-500' },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function AnnouncementRow({ ann }: { ann: Announcement }) {
  const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.GENERAL;
  const markRead = useMarkAnnouncementRead();

  function handleClick() {
    if (!ann.isRead) markRead.mutate(ann.id);
  }

  return (
    <Link
      href={`/announcements/${ann.id}`}
      onClick={handleClick}
      className={`group block rounded-xl border-l-4 ${cfg.accent} border border-l-0 ${ann.isRead ? 'border-slate-200 bg-white' : `${cfg.border} ${cfg.bg}`} p-5 hover:shadow-md transition-all`}
      style={{ borderLeftWidth: '4px' }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.colour}`}>
              {ann.type === 'URGENT'           && <Zap     className="h-3 w-3" />}
              {ann.type === 'IMPORTANT'        && <BookOpen className="h-3 w-3" />}
              {ann.type === 'COMMUNITY_UPDATE' && <Users   className="h-3 w-3" />}
              {ann.type === 'SYSTEM_UPDATE'    && <Settings className="h-3 w-3" />}
              {ann.type === 'GENERAL'          && <Bell    className="h-3 w-3" />}
              {cfg.label}
            </span>
            {!ann.isRead && (
              <span className="rounded-full bg-[#043658] px-2 py-0.5 text-[10px] font-bold text-white">
                NEW
              </span>
            )}
            {ann.community && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                {ann.community.name}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className={`text-base font-semibold leading-snug group-hover:text-[#043658] transition-colors ${ann.isRead ? 'text-slate-700' : 'text-[#043658]'}`}>
            {ann.title}
          </h3>

          {/* Preview */}
          <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {ann.content}
          </p>

          {/* Meta */}
          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
            <span className="font-medium text-slate-500">{ann.createdByName}</span>
            <span>·</span>
            <span>{timeAgo(ann.publishedAt ?? ann.createdAt)}</span>
            {ann.attachmentName && (
              <>
                <span>·</span>
                <span className="text-[#043658] font-medium">📎 {ann.attachmentName}</span>
              </>
            )}
          </div>
        </div>

        <span className="text-sm text-[#043658] font-medium shrink-0 group-hover:translate-x-0.5 transition-transform mt-1">
          → Read
        </span>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useTeacherAnnouncements({ page, limit: 15 });

  const announcements = data?.data ?? [];
  const meta          = data?.meta;
  const unread        = announcements.filter((a) => !a.isRead).length;

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#043658]" />
                <h1 className="text-xl font-bold text-[#043658]">Announcements</h1>
                {unread > 0 && (
                  <span className="rounded-full bg-[#043658] px-2 py-0.5 text-xs font-bold text-white">
                    {unread} new
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Stay updated with the latest news from ServeLink administrators.
              </p>
            </div>
            <button onClick={() => refetch()} className="text-slate-400 hover:text-[#043658] transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#043658]" />
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <p className="text-sm text-red-700 mb-3">Failed to load announcements.</p>
              <button onClick={() => refetch()} className="text-sm font-medium text-red-700 hover:underline">
                Try again
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Megaphone className="mb-3 h-12 w-12 text-slate-200" />
              <p className="text-sm font-semibold text-slate-600">No announcements yet.</p>
              <p className="mt-1 text-xs text-slate-400">Check back later for updates from administrators.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <AnnouncementRow key={ann.id} ann={ann} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {page} of {meta.totalPages}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
