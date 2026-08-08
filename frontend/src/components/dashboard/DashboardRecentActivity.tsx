'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, ChevronRight } from 'lucide-react';
import type { DashboardNotification } from '@/types/dashboard';
import { getNotificationRoute } from '@/lib/notification-utils';
import type { NotificationType } from '@/types/notification';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  return `${d}d ago`;
}

const TYPE_EMOJI: Record<string, string> = {
  LIKE: '❤️',
  COMMENT: '💬',
  BOOKMARK: '📌',
  COMMUNITY_JOIN: '🏫',
  LEVEL_UPGRADE: '⬆️',
  REPORT: '🚩',
  SYSTEM: '📣',
  REPLY: '↩️',
};

interface Props {
  notifications: DashboardNotification[];
}

export function DashboardRecentActivity({ notifications }: Props) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-[#043658]">Recent Activity</h2>
        <Link
          href="/notifications"
          className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:underline focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded"
        >
          View All <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <Bell className="h-4.5 w-4.5 text-slate-400" strokeWidth={1.5} />
          </div>
          <p className="text-xs text-slate-500">No recent activity</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => {
            const route = getNotificationRoute(
              n.type as NotificationType,
              n.referenceId,
            );

            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => router.push(route)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#043658]/20 ${
                    !n.isRead ? 'bg-[#043658]/[0.025]' : ''
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
                    {TYPE_EMOJI[n.type] ?? '🔔'}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`line-clamp-1 text-xs ${
                          n.isRead
                            ? 'font-normal text-slate-700'
                            : 'font-semibold text-[#043658]'
                        }`}
                      >
                        {n.title}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="text-[10px] text-slate-400">
                          {relativeTime(n.createdAt)}
                        </span>
                        {!n.isRead && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#043658]" aria-label="Unread" />
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                      {n.message}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
