import type { NotificationType } from '@/types/notification';

export function getNotificationRoute(type: NotificationType, referenceId?: string | null): string {
  switch (type) {
    case 'LIKE':
    case 'COMMENT':
    case 'BOOKMARK':
    case 'REPLY':
      return referenceId ? `/community/post/${referenceId}` : '/community';
    case 'COMMUNITY_JOIN':
      return referenceId ? `/community/${referenceId}` : '/community';
    case 'LEVEL_UPGRADE':
      return '/profile';
    case 'REPORT':
    case 'SYSTEM':
    default:
      return '/notifications';
  }
}

export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getDateGroup(dateString: string): 'Today' | 'Yesterday' | 'Earlier' {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDay.getTime() === today.getTime()) return 'Today';
  if (notifDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

export interface NotificationTypeConfig {
  emoji: string;
  label: string;
  bgColor: string;
  textColor: string;
}

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, NotificationTypeConfig> = {
  LIKE: {
    emoji: '❤️',
    label: 'Like',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
  COMMENT: {
    emoji: '💬',
    label: 'Comment',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  BOOKMARK: {
    emoji: '📌',
    label: 'Bookmark',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  COMMUNITY_JOIN: {
    emoji: '🏫',
    label: 'Community',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  LEVEL_UPGRADE: {
    emoji: '⬆️',
    label: 'Level Up',
    bgColor: 'bg-[#043658]/10',
    textColor: 'text-[#043658]',
  },
  REPORT: {
    emoji: '🚩',
    label: 'Report',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
  SYSTEM: {
    emoji: '📣',
    label: 'System',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  },
  REPLY: {
    emoji: '↩️',
    label: 'Reply',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
};
