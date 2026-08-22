'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, Loader2, Megaphone, Bell, BookOpen, Zap, Users,
  Settings, Download, AlertCircle, Globe, School, MapPin,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useTeacherAnnouncement, useMarkAnnouncementRead } from '@/hooks/useAnnouncements';
import type { AnnouncementType, AnnouncementTarget } from '@/services/announcements';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, { label: string; colour: string; bg: string; border: string }> = {
  GENERAL:          { label: 'General',          colour: 'text-slate-700',  bg: 'bg-slate-100',  border: 'border-slate-300'  },
  IMPORTANT:        { label: 'Important',        colour: 'text-blue-700',   bg: 'bg-blue-100',   border: 'border-blue-300'   },
  URGENT:           { label: 'Urgent',           colour: 'text-red-700',    bg: 'bg-red-100',    border: 'border-red-300'    },
  COMMUNITY_UPDATE: { label: 'Community Update', colour: 'text-green-700',  bg: 'bg-green-100',  border: 'border-green-300'  },
  SYSTEM_UPDATE:    { label: 'System Update',    colour: 'text-purple-700', bg: 'bg-purple-100', border: 'border-purple-300' },
};

const TARGET_ICONS: Record<AnnouncementTarget, React.ReactNode> = {
  ALL_TEACHERS: <Globe  className="h-4 w-4" />,
  SCHOOL:       <School className="h-4 w-4" />,
  WOREDA:       <MapPin className="h-4 w-4" />,
  ZONE:         <MapPin className="h-4 w-4" />,
  REGION:       <MapPin className="h-4 w-4" />,
  NATIONAL:     <Globe  className="h-4 w-4" />,
};

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  ALL_TEACHERS: 'All Teachers',
  SCHOOL:       'School Community',
  WOREDA:       'Woreda Community',
  ZONE:         'Zone Community',
  REGION:       'Region Community',
  NATIONAL:     'National Community',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ id: string }> }

export default function AnnouncementDetailPage({ params }: Props) {
  const { id } = use(params);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: ann, isLoading, isError } = useTeacherAnnouncement(id);
  const markRead = useMarkAnnouncementRead();

  // Mark as read when opened
  useEffect(() => {
    if (ann && !ann.isRead) {
      markRead.mutate(ann.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ann?.id, ann?.isRead]);

  const cfg = ann ? (TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.GENERAL) : null;

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">

          {/* Back */}
          <Link
            href="/announcements"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#043658] hover:opacity-70 mb-6"
          >
            <ChevronLeft className="h-4 w-4" /> All Announcements
          </Link>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-[#043658]" />
            </div>
          )}

          {/* Error / 403 */}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-400" />
              <p className="text-sm font-semibold text-red-700">Announcement not found</p>
              <p className="mt-1 text-xs text-red-500">
                It may have been removed, or you may not have access.
              </p>
              <Link href="/announcements" className="mt-4 inline-block text-sm font-medium text-red-700 hover:underline">
                ← Back to announcements
              </Link>
            </div>
          )}

          {/* Content */}
          {ann && cfg && (
            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Colour band */}
              <div className={`h-2 w-full ${
                ann.type === 'URGENT'           ? 'bg-red-500'    :
                ann.type === 'IMPORTANT'        ? 'bg-blue-500'   :
                ann.type === 'COMMUNITY_UPDATE' ? 'bg-green-500'  :
                ann.type === 'SYSTEM_UPDATE'    ? 'bg-purple-500' :
                                                  'bg-slate-400'
              }`} />

              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${cfg.bg} ${cfg.colour} ${cfg.border}`}>
                    {ann.type === 'URGENT'           && <Zap     className="h-3.5 w-3.5" />}
                    {ann.type === 'IMPORTANT'        && <BookOpen className="h-3.5 w-3.5" />}
                    {ann.type === 'COMMUNITY_UPDATE' && <Users   className="h-3.5 w-3.5" />}
                    {ann.type === 'SYSTEM_UPDATE'    && <Settings className="h-3.5 w-3.5" />}
                    {ann.type === 'GENERAL'          && <Bell    className="h-3.5 w-3.5" />}
                    {cfg.label}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                    {TARGET_ICONS[ann.targetAudience]}
                    {TARGET_LABELS[ann.targetAudience]}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-[#043658] leading-snug mb-4">
                  {ann.title}
                </h1>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 pb-5 mb-6 border-b border-slate-100">
                  <span className="flex items-center gap-1">
                    <Megaphone className="h-3.5 w-3.5" />
                    <span className="font-medium text-slate-700">{ann.createdByName}</span>
                  </span>
                  {ann.publishedAt && (
                    <span>Published {formatDate(ann.publishedAt)}</span>
                  )}
                  {ann.community && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium">
                      {ann.community.name}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {ann.content}
                </div>

                {/* Attachment */}
                {ann.attachmentUrl && ann.attachmentName && (
                  <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#043658]/10 shrink-0">
                        <Download className="h-5 w-5 text-[#043658]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#043658] truncate">{ann.attachmentName}</p>
                        {ann.attachmentSize && (
                          <p className="text-xs text-slate-400">{(ann.attachmentSize / 1024 / 1024).toFixed(2)} MB</p>
                        )}
                      </div>
                    </div>
                    <a
                      href={`/${ann.attachmentUrl}`}
                      download={ann.attachmentName}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-3 py-2 text-xs font-semibold text-white hover:bg-[#032742] shrink-0 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </a>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
