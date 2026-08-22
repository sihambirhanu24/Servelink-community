'use client';

import Link from 'next/link';
import { Megaphone, Bell, BookOpen, Zap, Users, Settings, ChevronRight, Loader2 } from 'lucide-react';
import { useTeacherAnnouncements, useMarkAnnouncementRead } from '@/hooks/useAnnouncements';
import type { Announcement, AnnouncementType } from '@/services/announcements';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<AnnouncementType, { label: string; colour: string; bg: string; border: string; accent: string }> = {
  GENERAL:          { label: 'General',          colour: 'text-slate-700',  bg: 'bg-slate-50',       border: 'border-slate-200',  accent: 'bg-slate-400'  },
  IMPORTANT:        { label: 'Important',        colour: 'text-blue-700',   bg: 'bg-blue-50',        border: 'border-blue-200',   accent: 'bg-blue-500'   },
  URGENT:           { label: 'Urgent',           colour: 'text-red-700',    bg: 'bg-red-50',         border: 'border-red-200',    accent: 'bg-red-500'    },
  COMMUNITY_UPDATE: { label: 'Community Update', colour: 'text-green-700',  bg: 'bg-green-50',       border: 'border-green-200',  accent: 'bg-green-500'  },
  SYSTEM_UPDATE:    { label: 'System Update',    colour: 'text-purple-700', bg: 'bg-purple-50',      border: 'border-purple-200', accent: 'bg-purple-500' },
};

const TYPE_ICONS: Record<AnnouncementType, React.ReactNode> = {
  GENERAL:          <Bell      className="h-3.5 w-3.5" />,
  IMPORTANT:        <BookOpen  className="h-3.5 w-3.5" />,
  URGENT:           <Zap       className="h-3.5 w-3.5" />,
  COMMUNITY_UPDATE: <Users     className="h-3.5 w-3.5" />,
  SYSTEM_UPDATE:    <Settings  className="h-3.5 w-3.5" />,
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

// ─── Single card ──────────────────────────────────────────────────────────────

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const cfg  = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.GENERAL;
  const icon = TYPE_ICONS[ann.type]  ?? TYPE_ICONS.GENERAL;
  const markRead = useMarkAnnouncementRead();

  function handleClick() {
    if (!ann.isRead) {
      markRead.mutate(ann.id);
    }
  }

  return (
    <Link
      href={`/announcements/${ann.id}`}
      onClick={handleClick}
      className={`group block rounded-xl border ${cfg.border} ${ann.isRead ? 'bg-white' : cfg.bg} p-4 hover:shadow-md transition-all`}
    >
      <div className="flex items-start gap-3">
        {/* Accent line */}
        <div className={`mt-0.5 h-full w-1 rounded-full shrink-0 ${cfg.accent} opacity-70`} style={{ minHeight: '2.5rem' }} />

        <div className="flex-1 min-w-0">
          {/* Type badge + unread dot */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cfg.bg} ${cfg.colour} border ${cfg.border}`}>
              {icon}{cfg.label}
            </span>
            {!ann.isRead && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#043658] px-2 py-0.5 text-[10px] font-bold text-white">
                NEW
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className={`text-sm font-semibold leading-snug line-clamp-2 group-hover:text-[#043658] transition-colors ${ann.isRead ? 'text-slate-700' : 'text-[#043658]'}`}>
            {ann.title}
          </h4>

          {/* Preview */}
          <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {ann.content}
          </p>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-medium text-slate-500">{ann.createdByName}</span>
              <span>·</span>
              <span>{timeAgo(ann.publishedAt ?? ann.createdAt)}</span>
              {ann.community && (
                <>
                  <span>·</span>
                  <span>{ann.community.name}</span>
                </>
              )}
            </div>
            <span className="text-xs text-[#043658] font-medium group-hover:translate-x-0.5 transition-transform">
              Read more →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export function AnnouncementsWidget() {
  const { data, isLoading } = useTeacherAnnouncements({ limit: 4 });
  const announcements = data?.data ?? [];
  const unreadCount   = announcements.filter((a) => !a.isRead).length;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#043658]" />
          <h2 className="text-sm font-semibold text-slate-900">Announcements</h2>
        </div>
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#043658]" />
          <h2 className="text-sm font-semibold text-slate-900">Announcements</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#043658] px-2 py-0.5 text-[10px] font-bold text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link
          href="/announcements"
          className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:opacity-70"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Megaphone className="mb-2 h-8 w-8 text-slate-200" />
            <p className="text-xs text-slate-400">No announcements yet.</p>
          </div>
        ) : (
          announcements.map((ann) => <AnnouncementCard key={ann.id} ann={ann} />)
        )}
      </div>

      {/* Footer */}
      {announcements.length > 0 && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <Link href="/announcements" className="flex items-center justify-center gap-1 text-xs font-medium text-[#043658] hover:opacity-70">
            See all announcements <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
