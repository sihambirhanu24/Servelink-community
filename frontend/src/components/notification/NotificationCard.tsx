'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { getNotificationRoute, getRelativeTime, NOTIFICATION_TYPE_CONFIG } from '@/lib/notification-utils';
import { useMarkRead, useDeleteNotification } from '@/hooks/useNotifications';
import type { Notification } from '@/types/notification';

interface NotificationCardProps {
  notification: Notification;
  compact?: boolean;
}

export function NotificationCard({ notification, compact = false }: NotificationCardProps) {
  const router = useRouter();
  const { mutate: markRead } = useMarkRead();
  const { mutate: deleteNotif } = useDeleteNotification();

  const config = NOTIFICATION_TYPE_CONFIG[notification.type];
  const route = getNotificationRoute(notification.type, notification.referenceId);
  const timeAgo = getRelativeTime(notification.createdAt);

  function handleClick() {
    if (!notification.isRead) {
      markRead(notification.id);
    }
    router.push(route);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    deleteNotif(notification.id);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${notification.title} — ${timeAgo}. ${notification.isRead ? 'Read' : 'Unread'}`}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={`group relative flex cursor-pointer items-start gap-3 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#043658]/20 ${
        compact ? 'px-4 py-3 hover:bg-gray-50' : 'rounded-xl border border-gray-200 bg-white p-4 hover:border-[#043658]/20 hover:shadow-sm'
      } ${!notification.isRead ? (compact ? 'bg-blue-50/60' : 'bg-[#043658]/[0.03]') : ''}`}
    >
      {!notification.isRead && (
        <span
          className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-[#043658]"
          aria-hidden="true"
        />
      )}

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${config.bgColor}`}
        aria-hidden="true"
      >
        {config.emoji}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm leading-snug ${
              notification.isRead ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'
            }`}
          >
            {notification.title}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="whitespace-nowrap text-xs text-gray-400">{timeAgo}</span>
            {!notification.isRead && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-[#043658]" aria-label="Unread" />
            )}
          </div>
        </div>

        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{notification.message}</p>

        {notification.senderName && (
          <p className="mt-1 text-xs text-gray-400">from {notification.senderName}</p>
        )}
      </div>

      <button
        onClick={handleDelete}
        aria-label="Delete notification"
        className="absolute right-3 top-3 hidden rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 group-hover:flex focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
