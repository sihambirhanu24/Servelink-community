'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, CheckCheck, Trash2, MoreVertical, Mail, MailOpen } from 'lucide-react';
import { Menu } from '@headlessui/react';
import { useAdminNotifications, useMarkAdminRead, useMarkAdminUnread, useDeleteAdminNotification, useMarkAllAdminRead } from '@/hooks/useAdminNotifications';
import { AdminLayout } from '@/components/admin/layout';
import { AdminNotificationCard } from '@/components/notification/AdminNotificationCard';
import { NotificationSkeletonList } from '@/components/notification/NotificationSkeleton';
import { NotificationEmpty } from '@/components/notification/NotificationEmpty';
import type { AdminNotificationType } from '@/types/admin-notification';
import { ADMIN_NOTIFICATION_CATEGORIES } from '@/types/admin-notification';

type FilterTab = 'all' | 'unread' | 'read';

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const categoryFilter = ADMIN_NOTIFICATION_CATEGORIES.find(c => c.id === selectedCategory);
  const typeFilter = categoryFilter && categoryFilter.types.length > 0 ? categoryFilter.types[0] : undefined;

  const { data, isLoading, isFetching } = useAdminNotifications({
    page,
    limit: 20,
    unread: activeTab === 'unread' ? true : activeTab === 'read' ? false : undefined,
    search: searchQuery || undefined,
    type: typeFilter,
  });

  const { mutate: markRead } = useMarkAdminRead();
  const { mutate: markUnread } = useMarkAdminUnread();
  const { mutate: deleteNotification } = useDeleteAdminNotification();
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAdminRead();

  const notifications = data?.data ?? [];
  const meta = data?.meta;
  const totalUnread = notifications.filter(n => !n.isRead).length;

  if (!mounted) {
    return null; // Return null on server to prevent hydration mismatch
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#043658] sm:text-3xl">Notifications</h1>
            <p className="mt-1 text-sm text-gray-600">
              Stay up to date with important platform activity
            </p>
          </div>

          {/* Stats Row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-[#043658]">{meta?.total ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Unread</p>
              <p className="mt-1 text-2xl font-bold text-[#FFC107]">{totalUnread}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Page</p>
              <p className="mt-1 text-2xl font-bold text-gray-600">
                {meta?.page ?? 1} / {meta?.totalPages ?? 1}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1 lg:max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm transition focus:border-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setPage(1);
                  }}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm transition focus:border-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                >
                  {ADMIN_NOTIFICATION_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mark All Read */}
              {totalUnread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  disabled={isMarkingAll}
                  className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#043658]/90 disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b border-gray-200">
            {(['all', 'unread', 'read'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setPage(1);
                }}
                className={`
                  px-4 py-2 text-sm font-medium transition
                  ${
                    activeTab === tab
                      ? 'border-b-2 border-[#043658] text-[#043658]'
                      : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'unread' && totalUnread > 0 && (
                  <span className="ml-2 rounded-full bg-[#FFC107] px-2 py-0.5 text-xs font-semibold text-[#043658]">
                    {totalUnread}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
            {isLoading ? (
              <div className="p-4">
                <NotificationSkeletonList count={5} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8">
                <NotificationEmpty />
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div key={notification.id} className="group relative">
                    <AdminNotificationCard notification={notification} />
                    
                    {/* Actions Menu */}
                    <div className="absolute right-4 top-4">
                      <Menu as="div" className="relative">
                        <Menu.Button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 opacity-0 transition hover:bg-gray-100 hover:text-gray-600 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg border border-gray-200 bg-white py-1 shadow-lg focus:outline-none">
                          {notification.isRead ? (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => markUnread(notification.id)}
                                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                    active ? 'bg-gray-50 text-[#043658]' : 'text-gray-700'
                                  }`}
                                >
                                  <Mail className="h-4 w-4" />
                                  Mark as unread
                                </button>
                              )}
                            </Menu.Item>
                          ) : (
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => markRead(notification.id)}
                                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                    active ? 'bg-gray-50 text-[#043658]' : 'text-gray-700'
                                  }`}
                                >
                                  <MailOpen className="h-4 w-4" />
                                  Mark as read
                                </button>
                              )}
                            </Menu.Item>
                          )}
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => {
                                  if (confirm('Delete this notification?')) {
                                    deleteNotification(notification.id);
                                  }
                                }}
                                className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                                  active ? 'bg-red-50 text-red-600' : 'text-red-500'
                                }`}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-100 px-4 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPreviousPage || isFetching}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!meta.hasNextPage || isFetching}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
