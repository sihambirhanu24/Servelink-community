'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Clock,
  UserCheck,
  MapPin,
  AlertTriangle,
  Flag,
  HelpCircle,
  DollarSign,
  Wallet,
  Video,
  Settings,
  Users,
  ShieldAlert,
  FileWarning,
} from 'lucide-react';
import { useMarkAdminRead } from '@/hooks/useAdminNotifications';
import type { AdminNotification, AdminNotificationType } from '@/types/admin-notification';
import { formatDistanceToNow } from 'date-fns';

interface AdminNotificationCardProps {
  notification: AdminNotification;
  compact?: boolean;
}

const typeIcons: Record<AdminNotificationType, React.ElementType> = {
  TEACHER_VERIFICATION: UserCheck,
  LOCATION_CHANGE_REQUEST: MapPin,
  SUSPENSION_APPEAL: AlertTriangle,
  POST_REPORT: Flag,
  SUPPORT_REQUEST: HelpCircle,
  PAYMENT_ISSUE: DollarSign,
  PAYOUT_ISSUE: Wallet,
  LIVE_SESSION_ISSUE: Video,
  SYSTEM: Settings,
  COMMUNITY_FLAGGED: Users,
  TEACHER_FLAGGED: ShieldAlert,
  CONTENT_MODERATION: FileWarning,
};

const typeColors: Record<AdminNotificationType, string> = {
  TEACHER_VERIFICATION: 'text-blue-600 bg-blue-50',
  LOCATION_CHANGE_REQUEST: 'text-purple-600 bg-purple-50',
  SUSPENSION_APPEAL: 'text-orange-600 bg-orange-50',
  POST_REPORT: 'text-red-600 bg-red-50',
  SUPPORT_REQUEST: 'text-green-600 bg-green-50',
  PAYMENT_ISSUE: 'text-yellow-600 bg-yellow-50',
  PAYOUT_ISSUE: 'text-indigo-600 bg-indigo-50',
  LIVE_SESSION_ISSUE: 'text-pink-600 bg-pink-50',
  SYSTEM: 'text-gray-600 bg-gray-50',
  COMMUNITY_FLAGGED: 'text-amber-600 bg-amber-50',
  TEACHER_FLAGGED: 'text-red-600 bg-red-50',
  CONTENT_MODERATION: 'text-orange-600 bg-orange-50',
};

export function AdminNotificationCard({ notification, compact = false }: AdminNotificationCardProps) {
  const router = useRouter();
  const { mutate: markRead } = useMarkAdminRead();

  const Icon = typeIcons[notification.type] || Settings;
  const colorClass = typeColors[notification.type] || 'text-gray-600 bg-gray-50';

  const handleClick = () => {
    if (!notification.isRead) {
      markRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      onClick={handleClick}
      className={`
        cursor-pointer
        transition-colors
        ${notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/30 hover:bg-blue-50/50'}
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`text-sm font-semibold ${
                notification.isRead ? 'text-gray-700' : 'text-[#043658]'
              }`}
            >
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#FFC107]" aria-label="Unread" />
            )}
          </div>

          <p className={`mt-1 text-xs ${notification.isRead ? 'text-gray-500' : 'text-gray-600'} line-clamp-2`}>
            {notification.message}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
            <Clock className="h-3 w-3" />
            <time dateTime={notification.createdAt}>{timeAgo}</time>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
