'use client';

import { useState, useCallback, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, CheckCheck, Trash2, Bell } from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { NotificationCard } from '@/components/notification/NotificationCard';
import { NotificationEmpty } from '@/components/notification/NotificationEmpty';
import { NotificationSkeletonList } from '@/components/notification/NotificationSkeleton';
import { NotificationFilterTabs } from '@/components/notification/NotificationFilterTabs';
import { NotificationPagination } from '@/components/notification/NotificationPagination';
import { NotificationSettings } from '@/components/notification/NotificationSettings';
import {
  useNotifications,
  useMarkAllRead,
  useClearRead,
  useUnreadCount,
} from '@/hooks/useNotifications';
import { getDateGroup } from '@/lib/notification-utils';
import type { Notification } from '@/types/notification';
import type { NotificationFilterType, NotificationType } from '@/types/notification';

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [, startTransition] = useTransition();

  const queryParams = {
    page,
    limit: 15,
    ...(activeFilter !== 'ALL' && { type: activeFilter as NotificationType }),
    ...(showUnreadOnly && { unread: true }),
    ...(debouncedSearch && { search: debouncedSearch }),
  };

  const { data, isLoading, isFetching } = useNotifications(queryParams);
  const { data: unreadData } = useUnreadCount();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllRead();
  const { mutate: clearRead, isPending: isClearing } = useClearRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const totalCount = meta?.total ?? 0;
  const unreadCount = unreadData?.count ?? 0;

  const grouped = notifications.reduce<Record<string, Notification[]>>((acc, n) => {
    const group = getDateGroup(n.createdAt);
    if (!acc[group]) acc[group] = [];
    acc[group].push(n);
    return acc;
  }, {});

  const groupOrder: Array<'Today' | 'Yesterday' | 'Earlier'> = ['Today', 'Yesterday', 'Earlier'];

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setSearchQuery(value);
    startTransition(() => {
      setDebouncedSearch(value);
      setPage(1);
    });
  }

  const handleFilterChange = useCallback(
    (filter: NotificationFilterType, unreadOnly: boolean) => {
      setActiveFilter(filter);
      setShowUnreadOnly(unreadOnly);
      setPage(1);
    },
    [],
  );

  const isFiltered =
    activeFilter !== 'ALL' || showUnreadOnly || debouncedSearch.length > 0;

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#FFC107]">
                ServeLink inbox
              </p>
              <h1 className="mt-1 font-['Lexend'] text-2xl font-semibold text-[#043658]">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {totalCount > 0 ? (
                  <>
                    <span className="font-medium text-gray-700">{totalCount}</span> total
                    {unreadCount > 0 && (
                      <>
                        {' · '}
                        <span className="font-medium text-[#043658]">{unreadCount}</span> unread
                      </>
                    )}
                  </>
                ) : (
                  'Your notification history'
                )}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <NotificationSettings />
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
                >
                  <CheckCheck className="h-3.5 w-3.5 text-[#043658]" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => clearRead()}
                disabled={isClearing}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                Clear read
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search notifications…"
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Search notifications"
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
              />
            </div>
          </div>

          <div className="mb-5">
            <NotificationFilterTabs
              activeFilter={activeFilter}
              showUnreadOnly={showUnreadOnly}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className={`transition-opacity duration-150 ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
            {isLoading ? (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <NotificationSkeletonList count={8} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <NotificationEmpty isFiltered={isFiltered} />
              </div>
            ) : (
              <div className="space-y-6">
                {groupOrder.map((group) => {
                  const items = grouped[group];
                  if (!items || items.length === 0) return null;

                  return (
                    <section key={group}>
                      <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
                        <span>{group}</span>
                        <span className="h-px flex-1 bg-gray-100" />
                      </h2>
                      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                        <AnimatePresence initial={false}>
                          {items.map((notification, index) => (
                            <motion.div
                              key={notification.id}
                              className={index > 0 ? 'border-t border-gray-100' : ''}
                            >
                              <NotificationCard notification={notification} compact />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </section>
                  );
                })}

                {meta && (
                  <div className="rounded-2xl border border-gray-200 bg-white">
                    <NotificationPagination
                      meta={meta}
                      onPageChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
