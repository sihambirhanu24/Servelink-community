'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell, Bookmark, CheckCheck, ChevronRight, Heart,
  MessageCircle, RefreshCw, Search, Settings2, Trash2,
  Users, X, Award, Flag, CornerDownRight, AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  useClearRead,
  useDeleteNotification,
  useUnreadCount,
} from '@/hooks/useNotifications';
import { getDateGroup, getNotificationRoute, getRelativeTime } from '@/lib/notification-utils';
import type { Notification, NotificationFilterType, NotificationType } from '@/types/notification';

const TYPE_CONFIG: Record<NotificationType, { icon: React.ElementType; bg: string; color: string; label: string }> = {
  LIKE:           { icon: Heart,           bg: 'bg-rose-50',     color: 'text-rose-500',    label: 'Like'      },
  COMMENT:        { icon: MessageCircle,   bg: 'bg-blue-50',     color: 'text-blue-500',    label: 'Comment'   },
  REPLY:          { icon: CornerDownRight, bg: 'bg-indigo-50',   color: 'text-indigo-500',  label: 'Reply'     },
  BOOKMARK:       { icon: Bookmark,        bg: 'bg-amber-50',    color: 'text-amber-500',   label: 'Bookmark'  },
  COMMUNITY_JOIN: { icon: Users,           bg: 'bg-emerald-50',  color: 'text-emerald-600', label: 'Community' },
  LEVEL_UPGRADE:  { icon: Award,           bg: 'bg-[#FFC107]/15',color: 'text-[#043658]',  label: 'Level Up'  },
  REPORT:         { icon: Flag,            bg: 'bg-orange-50',   color: 'text-orange-500',  label: 'Report'    },
  SYSTEM:         { icon: Bell,            bg: 'bg-slate-100',   color: 'text-slate-500',   label: 'System'    },
};

const FILTER_TABS: { label: string; value: NotificationFilterType; unreadOnly?: boolean }[] = [
  { label: 'All',         value: 'ALL'            },
  { label: 'Unread',      value: 'ALL', unreadOnly: true },
  { label: 'Likes',       value: 'LIKE'           },
  { label: 'Comments',    value: 'COMMENT'        },
  { label: 'Bookmarks',   value: 'BOOKMARK'       },
  { label: 'Communities', value: 'COMMUNITY_JOIN' },
  { label: 'System',      value: 'SYSTEM'         },
];

const GROUP_ORDER = ['Today', 'Yesterday', 'Earlier'] as const;

// ── Skeleton ───────────────────────────────────────────
function NotifSkeleton() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-2/3 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-2.5 w-1/4 rounded bg-slate-100" />
      </div>
    </div>
  );
}

// ── Notification item ──────────────────────────────────
function NotifItem({ n }: { n: Notification }) {
  const router = useRouter();
  const { mutate: markRead } = useMarkRead();
  const { mutate: deleteN } = useDeleteNotification();
  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM;
  const Icon = cfg.icon;
  const route = getNotificationRoute(n.type, n.referenceId);

  function handleClick() {
    if (!n.isRead) markRead(n.id);
    router.push(route);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${n.title} — ${getRelativeTime(n.createdAt)}. ${n.isRead ? 'Read' : 'Unread'}`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#043658]/20 hover:bg-slate-50 ${
        !n.isRead ? 'bg-[#043658]/[0.025]' : ''
      }`}
    >
      {/* Unread left bar */}
      {!n.isRead && (
        <span className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-r-full bg-[#FFC107]" />
      )}

      {/* Type icon */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
        <Icon className={`h-4 w-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${n.isRead ? 'font-normal text-slate-700' : 'font-semibold text-[#043658]'}`}>
            {n.title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="whitespace-nowrap text-[11px] text-slate-400">{getRelativeTime(n.createdAt)}</span>
            {!n.isRead && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFC107]" />}
          </div>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{n.message}</p>
        {n.senderName && <p className="mt-0.5 text-[10px] text-slate-400">from {n.senderName}</p>}
      </div>

      {/* Delete on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); deleteN(n.id); }}
        aria-label="Delete notification"
        className="absolute right-3 top-2.5 hidden rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 group-hover:flex focus:outline-none"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}

// ── Sidebar cards ──────────────────────────────────────
function ActivitySideCard({ total, unread }: { total: number; unread: number }) {
  return (
    <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#043658]">Your Inbox</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {[
          { label: 'Total',   count: total,          icon: Bell    },
          { label: 'Unread',  count: unread,          icon: Heart   },
          { label: 'Read',    count: total - unread,  icon: CheckCheck },
        ].map(({ label, count, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#043658]/8">
                <Icon className="h-3 w-3 text-[#043658]" />
              </div>
              <span className="text-xs font-medium text-slate-600">{label}</span>
            </div>
            <span className={`text-xs font-bold ${label === 'Unread' && count > 0 ? 'text-[#FFC107]' : 'text-[#043658]'}`}>{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLinksSideCard() {
  return (
    <div className="rounded-xl border border-[#D9E2EC] bg-[#F8FAFC] shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#043658]">Quick Links</h3>
      </div>
      <div className="p-2">
        {[
          { label: 'Community Feed',    href: '/posts',     icon: MessageCircle },
          { label: 'My Bookmarks',      href: '/bookmarks', icon: Bookmark      },
          { label: 'My Profile',        href: '/profile',   icon: Award         },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-[#043658]/5 hover:text-[#043658]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#043658]/8">
              <Icon className="h-3 w-3 text-[#043658]" />
            </div>
            {label}
            <ChevronRight className="ml-auto h-3 w-3 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const queryParams = {
    page,
    limit: 20,
    ...(activeFilter !== 'ALL' && { type: activeFilter as NotificationType }),
    ...(showUnreadOnly && { unread: true }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data, isLoading, isError, isFetching, refetch } = useNotifications(queryParams);
  const { data: unreadData } = useUnreadCount();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();
  const { mutate: clearRead, isPending: isClearing } = useClearRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const totalCount = meta?.total ?? 0;
  const unreadCount = unreadData?.count ?? 0;

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const g = getDateGroup(n.createdAt);
    if (!acc[g]) acc[g] = [];
    acc[g].push(n);
    return acc;
  }, {});

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setSearchQuery(v);
    startTransition(() => { setDebouncedSearch(v); setPage(1); });
  }

  const handleFilterChange = useCallback((filter: NotificationFilterType, unreadOnly: boolean) => {
    setActiveFilter(filter);
    setShowUnreadOnly(unreadOnly);
    setPage(1);
  }, []);

  function isTabActive(tab: typeof FILTER_TABS[0]) {
    if (tab.unreadOnly) return showUnreadOnly;
    return activeFilter === tab.value && (tab.label !== 'All' || !showUnreadOnly);
  }

  const isFiltered = activeFilter !== 'ALL' || showUnreadOnly || debouncedSearch.length > 0;

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">

          {/* ── Page header — same pattern as posts/bookmarks ── */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">Activity Inbox</p>
              <h1 className="mt-1 text-xl font-bold text-[#043658]">Notifications</h1>
              <p className="mt-0.5 text-sm text-slate-500">Stay updated with activity from your communities, posts, and resources.</p>
              {!isLoading && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <span className="text-xs text-slate-400">
                    <span className="font-bold text-[#043658]">{totalCount}</span> total
                  </span>
                  {unreadCount > 0 && (
                    <>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs font-semibold text-[#FFC107]">{unreadCount} unread</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1.5 rounded-xl border border-[#043658]/20 bg-white px-3.5 py-2 text-xs font-semibold text-[#043658] shadow-sm transition hover:bg-[#043658] hover:text-white disabled:opacity-50"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => clearRead()}
                disabled={isClearing}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-500 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear read
              </button>
            </div>
          </div>

          

          {/* ── Filter tabs — same style as posts page type buttons ── */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = isTabActive(tab);
              return (
                <button
                  key={tab.label}
                  onClick={() => {
                    if (tab.unreadOnly) handleFilterChange('ALL', true);
                    else if (tab.label === 'All') handleFilterChange('ALL', false);
                    else handleFilterChange(tab.value, false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#043658]/20 ${
                    active
                      ? 'bg-[#043658] text-white font-semibold'
                      : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                  {tab.unreadOnly && unreadCount > 0 && (
                    <span className={`ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold ${active ? 'bg-white/20 text-white' : 'bg-[#FFC107]/20 text-[#043658]'}`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── 2-column layout ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_264px]">

            {/* Left: notification feed */}
            <div className="min-w-0">
              {!isLoading && !isError && notifications.length > 0 && (
                <p className="mb-2 text-xs text-slate-400">
                  {totalCount} notification{totalCount !== 1 ? 's' : ''}
                  {isFiltered ? ' match your filters' : ''}
                </p>
              )}

              {isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
                  <p className="mt-2 font-semibold text-red-700">Couldn't load notifications</p>
                  <p className="mt-1 text-sm text-red-500">Something went wrong. Please try again.</p>
                  <button type="button" onClick={() => refetch()}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </button>
                </div>
              ) : isLoading ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
                  {[1,2,3,4,5,6].map(i => <NotifSkeleton key={i} />)}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#043658]/8">
                    <Bell className="h-7 w-7 text-[#043658]/25" />
                  </div>
                  {isFiltered ? (
                    <>
                      <p className="mt-4 font-semibold text-[#043658]">No notifications found.</p>
                      <p className="mt-1 text-sm text-slate-400">Try changing your filters.</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-4 font-semibold text-[#043658]">You&apos;re all caught up</p>
                      <p className="mt-1 max-w-xs text-sm text-slate-400">New activity from your communities and posts will appear here.</p>
                      <Link href="/posts" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] transition-colors">
                        Explore Community
                      </Link>
                    </>
                  )}
                </div>
              ) : (
                <div className={`space-y-3 transition-opacity duration-150 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
                  {GROUP_ORDER.map((group) => {
                    const items = grouped[group];
                    if (!items?.length) return null;
                    return (
                      <section key={group}>
                        <div className="mb-1.5 flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{group}</span>
                          <span className="h-px flex-1 bg-slate-200" />
                          <span className="text-[10px] font-medium text-slate-300">{items.length}</span>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <AnimatePresence initial={false}>
                            {items.map((n, idx) => (
                              <div key={n.id} className={idx > 0 ? 'border-t border-slate-100' : ''}>
                                <NotifItem n={n} />
                              </div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </section>
                    );
                  })}

                  {/* Pagination */}
                  {meta && meta.totalPages > 1 && (
                    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs text-slate-500">
                        Page <span className="font-semibold text-[#043658]">{meta.page}</span> of{' '}
                        <span className="font-semibold text-[#043658]">{meta.totalPages}</span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button disabled={!meta.hasPreviousPage}
                          onClick={() => { setPage(p => p-1); window.scrollTo({top:0,behavior:'smooth'}); }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#043658] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 transition-colors">
                          ← Prev
                        </button>
                        <button disabled={!meta.hasNextPage}
                          onClick={() => { setPage(p => p+1); window.scrollTo({top:0,behavior:'smooth'}); }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#043658] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50 transition-colors">
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-0 space-y-4">
                <ActivitySideCard total={totalCount} unread={unreadCount} />
                <QuickLinksSideCard />
              </div>
            </aside>
          </div>

          {/* Mobile sidebar */}
          <div className="mt-6 space-y-4 lg:hidden">
            <ActivitySideCard total={totalCount} unread={unreadCount} />
            <QuickLinksSideCard />
          </div>

        </div>
      </main>
    </div>
  );
}
