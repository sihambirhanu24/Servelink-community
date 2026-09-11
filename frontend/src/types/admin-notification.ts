export type AdminNotificationType =
  | 'TEACHER_VERIFICATION'
  | 'LOCATION_CHANGE_REQUEST'
  | 'SUSPENSION_APPEAL'
  | 'POST_REPORT'
  | 'SUPPORT_REQUEST'
  | 'PAYMENT_ISSUE'
  | 'PAYOUT_ISSUE'
  | 'LIVE_SESSION_ISSUE'
  | 'SYSTEM'
  | 'COMMUNITY_FLAGGED'
  | 'TEACHER_FLAGGED'
  | 'CONTENT_MODERATION';

export interface AdminNotification {
  id: string;
  adminId: string;
  title: string;
  message: string;
  type: AdminNotificationType;
  referenceId?: string | null;
  link?: string | null;
  metadata?: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminNotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminNotificationsResponse {
  data: AdminNotification[];
  meta: AdminNotificationMeta;
}

export interface AdminUnreadCountResponse {
  count: number;
}

export type AdminNotificationFilterType = 'ALL' | AdminNotificationType;

export interface AdminNotificationQueryParams {
  page?: number;
  limit?: number;
  type?: AdminNotificationType;
  unread?: boolean;
  search?: string;
}

export interface AdminNotificationCategory {
  id: string;
  label: string;
  types: AdminNotificationType[];
}

export const ADMIN_NOTIFICATION_CATEGORIES: AdminNotificationCategory[] = [
  {
    id: 'all',
    label: 'All',
    types: [],
  },
  {
    id: 'teachers',
    label: 'Teachers',
    types: ['TEACHER_VERIFICATION', 'LOCATION_CHANGE_REQUEST', 'TEACHER_FLAGGED'],
  },
  {
    id: 'reports',
    label: 'Reports',
    types: ['POST_REPORT', 'CONTENT_MODERATION'],
  },
  {
    id: 'appeals',
    label: 'Appeals',
    types: ['SUSPENSION_APPEAL'],
  },
  {
    id: 'communities',
    label: 'Communities',
    types: ['COMMUNITY_FLAGGED'],
  },
  {
    id: 'payments',
    label: 'Payments',
    types: ['PAYMENT_ISSUE'],
  },
  {
    id: 'payouts',
    label: 'Payouts',
    types: ['PAYOUT_ISSUE'],
  },
  {
    id: 'live_sessions',
    label: 'Live Sessions',
    types: ['LIVE_SESSION_ISSUE'],
  },
  {
    id: 'system',
    label: 'System',
    types: ['SYSTEM', 'SUPPORT_REQUEST'],
  },
];
