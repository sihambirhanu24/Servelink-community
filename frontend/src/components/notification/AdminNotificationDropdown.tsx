'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminNotifications, useMarkAllAdminRead } from '@/hooks/useAdminNotifications';
import { AdminNotificationCard } from './AdminNotificationCard';
import { NotificationSkeletonList } from './NotificationSkeleton';
import { NotificationEmpty } from './NotificationEmpty';
import { useAdminNotificationContext } from '@/context/AdminNotificationContext';

export function AdminNotificationDropdown() {
  const { isDropdownOpen, closeDropdown } = useAdminNotificationContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useAdminNotifications({ limit: 10 });
  const { mutate: markAllRead, isPending: isMarkingAll } = useMarkAllAdminRead();

  useEffect(() => {
    if (!isDropdownOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDropdown();
    }
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    }
    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

  const notifications = data?.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div ref={containerRef} className="relative">
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 w-[420px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Admin Notifications"
            style={{ zIndex: 100 }}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#043658]">Admin Notifications</h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#043658] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead()}
                    disabled={isMarkingAll}
                    className="text-xs font-medium text-[#043658] transition-opacity hover:opacity-70 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded px-2 py-1"
                  >
                    Mark all read
                  </button>
                )}
                <Link
                  href="/admin/notifications"
                  onClick={closeDropdown}
                  className="text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded px-2 py-1"
                >
                  See all
                </Link>
              </div>
            </div>

            <div
              className="max-h-[480px] overflow-y-auto"
              role="list"
              aria-label="Recent admin notifications"
            >
              {isLoading ? (
                <NotificationSkeletonList count={5} />
              ) : notifications.length === 0 ? (
                <NotificationEmpty />
              ) : (
                <div className="divide-y divide-gray-50">
                  <AnimatePresence initial={false}>
                    {notifications.map((notification) => (
                      <div key={notification.id} onClick={closeDropdown} role="listitem">
                        <AdminNotificationCard notification={notification} compact />
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="border-t border-gray-100 px-4 py-2.5 text-center">
                <Link
                  href="/admin/notifications"
                  onClick={closeDropdown}
                  className="text-xs font-medium text-[#043658] hover:underline focus:outline-none focus:ring-2 focus:ring-[#043658]/30 rounded"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
