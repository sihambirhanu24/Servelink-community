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
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useAuth } from '@/context/AuthContext';
import { fetchAccessibleChatGroups, type ChatGroup } from '@/services/chat';

// Community type → colour + icon
const TYPE_CONFIG: Record<
  string,
  { label: string; colour: string; bg: string; icon: React.ReactNode }
> = {
  SCHOOL: {
    label: 'School',
    colour: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: <School className="w-5 h-5" />,
  },
  WOREDA: {
    label: 'Woreda',
    colour: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    icon: <MapPin className="w-5 h-5" />,
  },
  ZONE: {
    label: 'Zone',
    colour: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: <MapPin className="w-5 h-5" />,
  },
  REGION: {
    label: 'Region',
    colour: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    icon: <Globe className="w-5 h-5" />,
  },
  NATIONAL: {
    label: 'National',
    colour: 'text-rose-700',
    bg: 'bg-rose-50 border-rose-200',
    icon: <Globe className="w-5 h-5" />,
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

export default function ChatLandingPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [token]);  // token, not user?.id — axios interceptor carries the auth

  useEffect(() => { load(); }, [load]);

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
              Your accessible chat groups based on your level and location
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
              <p className="text-red-700 mb-3">{error}</p>
              <button
                onClick={load}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Retry
              </button>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-16">
              <MessageCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">
                No Communities Found
              </h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                Your community chat groups are being set up. Make sure your school,
                woreda, zone, and region are correctly set in your profile, then retry.
              </p>
              <button
                onClick={load}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#043658] text-white rounded-lg hover:bg-[#043658]/90 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groups.map((group) => {
                const cfg = TYPE_CONFIG[group.type] ?? TYPE_CONFIG['NATIONAL'];
                return (
                  <button
                    key={group.id}
                    onClick={() => router.push(`/community/chat/${group.id}`)}
                    className={`text-left bg-white rounded-xl border p-5 hover:shadow-md transition-all group ${cfg.bg}`}
                  >
                    {/* Top row: icon + name + unread badge */}
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 ${cfg.colour}`}>{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold text-slate-900 truncate text-sm group-hover:text-[#043658]">
                            {group.name}
                          </h3>
                          {group.unreadCount > 0 && (
                            <span className="flex-shrink-0 bg-[#043658] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                              {group.unreadCount > 99 ? '99+' : group.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-medium mt-0.5 ${cfg.colour}`}>
                          {cfg.label} Community
                        </p>
                      </div>
                    </div>

                    {/* Last message */}
                    <div className="mt-3 min-h-[2.5rem]">
                      {group.lastMessage ? (
                        <div>
                          <p className="text-xs text-slate-600 line-clamp-2">
                            <span className="font-medium">{group.lastMessage.senderName}:</span>{' '}
                            {group.lastMessage.content}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {timeAgo(group.lastMessage.createdAt)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No messages yet</p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Open Chat</span>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-[#043658] transition-colors">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
