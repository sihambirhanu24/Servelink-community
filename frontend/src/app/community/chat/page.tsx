'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  MessageCircle,
  Users,
  Loader,
  RefreshCw,
  School,
  MapPin,
  Globe,
  BookOpen,
  Layers,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/context/AuthContext';
import { fetchAccessibleChatGroups, type ChatGroup } from '@/services/chat';

// ─── Config ───────────────────────────────────────────────────────────────────

/** Colours/icons for each community TYPE */
const TYPE_CONFIG: Record<string, { label: string; colour: string; bg: string; border: string; icon: React.ReactNode }> = {
  SCHOOL: {
    label: 'School',
    colour: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <School className="w-4 h-4" />,
  },
  WOREDA: {
    label: 'Woreda',
    colour: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <MapPin className="w-4 h-4" />,
  },
  ZONE: {
    label: 'Zone',
    colour: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <MapPin className="w-4 h-4" />,
  },
  REGION: {
    label: 'Region',
    colour: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: <Globe className="w-4 h-4" />,
  },
  NATIONAL: {
    label: 'National',
    colour: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: <Globe className="w-4 h-4" />,
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Build the subtitle line shown under the community name */
function buildSubtitle(group: ChatGroup): string {
  const geo = [group.school, group.woreda, group.zone, group.region]
    .filter(Boolean)
    .join(' • ');

  if (group.subtype === 'DEPARTMENT') {
    return [geo, group.department].filter(Boolean).join(' • ');
  }
  return geo ? `${geo} • All Departments` : 'All Departments';
}

/** Build the scope badge label shown on the card */
function scopeBadge(group: ChatGroup): { text: string; cls: string } {
  if (group.subtype === 'DEPARTMENT') {
    return {
      text: group.department ?? 'Department',
      cls: 'bg-[#FFC107]/20 text-[#7A5100]',
    };
  }
  return {
    text: 'Common',
    cls: 'bg-slate-100 text-slate-600',
  };
}

// ─── Community Card ───────────────────────────────────────────────────────────

function CommunityCard({ group, onClick }: { group: ChatGroup; onClick: () => void }) {
  const cfg   = TYPE_CONFIG[group.type] ?? TYPE_CONFIG['NATIONAL'];
  const badge = scopeBadge(group);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl border ${cfg.border} ${cfg.bg} bg-white p-5 hover:shadow-md hover:border-[#043658]/30 transition-all group`}
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Type icon */}
        <div className={`mt-0.5 p-2 rounded-lg ${cfg.bg} ${cfg.colour} border ${cfg.border} shrink-0`}>
          {group.subtype === 'DEPARTMENT'
            ? <BookOpen className="w-4 h-4" />
            : cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + unread badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-[#043658] transition-colors line-clamp-2">
              {group.name}
            </h3>
            {group.unreadCount > 0 && (
              <span className="flex-shrink-0 bg-[#043658] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.5rem] text-center">
                {group.unreadCount > 99 ? '99+' : group.unreadCount}
              </span>
            )}
          </div>

          {/* Type label + scope badge */}
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={`text-xs font-medium ${cfg.colour}`}>{cfg.label}</span>
            <span className="text-slate-300 text-xs">·</span>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${badge.cls}`}>
              {badge.text}
            </span>
          </div>
        </div>
      </div>

      {/* Subtitle (geographic scope) */}
      <p className="mt-2 text-xs text-slate-500 truncate">
        {buildSubtitle(group)}
      </p>

      {/* Last message preview */}
      <div className="mt-3 min-h-[2rem]">
        {group.lastMessage ? (
          <div>
            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              <span className="font-medium">{group.lastMessage.senderName}:</span>{' '}
              {group.lastMessage.content}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{timeAgo(group.lastMessage.createdAt)}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No messages yet — start the conversation</p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {group.memberCount !== undefined && group.memberCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              {group.memberCount}
            </span>
          )}
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <MessageCircle className="w-3 h-3" />
            Open Chat
          </span>
        </div>
        <span className="text-xs text-slate-400 group-hover:text-[#043658] transition-colors font-medium">
          →
        </span>
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatLandingPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [groups, setGroups]       = useState<ChatGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) { setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAccessibleChatGroups();
      setGroups(data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load chat groups. Please retry.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Separate DEPARTMENT communities from COMMON ones for grouped display
  const deptGroups   = groups.filter((g) => g.subtype === 'DEPARTMENT');
  const commonGroups = groups.filter((g) => g.subtype === 'COMMON');

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-slate-50">
        <DashboardSidebar />
        <Topbar />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto text-[#043658] mb-3" />
            <p className="text-slate-600 text-sm">Loading your communities…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-3 z-10">
          <div className="flex items-center justify-between">
            <Link
              href="/community"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#043658] hover:opacity-70"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Communities
            </Link>
            <button
              onClick={load}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#043658]"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>
          <div className="mt-2">
            <h1 className="text-xl font-semibold text-slate-900">Community Chat</h1>
            <p className="text-sm text-slate-500">
              Your chat groups — based on your level, location, and department
            </p>
          </div>
        </div>

        <div className="px-6 py-6 space-y-8">

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 mb-3">{error}</p>
              <button
                onClick={load}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!error && groups.length === 0 && (
            <div className="text-center py-16">
              <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">No Communities Found</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                Your community chat groups are being set up. Make sure your school, woreda, zone,
                region, and department are correctly set in your profile, then retry.
              </p>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#043658] text-white rounded-lg hover:bg-[#043658]/90 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          {/* DEPARTMENT communities section */}
          {!error && deptGroups.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-[#043658]" />
                <h2 className="text-sm font-semibold text-slate-900">Department Communities</h2>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {deptGroups.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {deptGroups.map((group) => (
                  <CommunityCard
                    key={group.id}
                    group={group}
                    onClick={() => router.push(`/community/chat/${group.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* COMMON communities section */}
          {!error && commonGroups.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Layers className="w-4 h-4 text-[#043658]" />
                <h2 className="text-sm font-semibold text-slate-900">
                  {deptGroups.length > 0 ? 'Level Communities' : 'My Communities'}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {commonGroups.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {commonGroups.map((group) => (
                  <CommunityCard
                    key={group.id}
                    group={group}
                    onClick={() => router.push(`/community/chat/${group.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
