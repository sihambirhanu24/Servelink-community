export type NotificationType =
  | 'LIKE'
  | 'COMMENT'
  | 'BOOKMARK'
  | 'COMMUNITY_JOIN'
  | 'LEVEL_UPGRADE'
  | 'REPORT'
  | 'SYSTEM'
  | 'REPLY';

export interface Notification {
  id: string;
  receiverId: string;
  senderId?: string | null;
  senderName?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface NotificationsResponse {
  data: Notification[];
  meta: NotificationMeta;
}

export interface UnreadCountResponse {
  count: number;
}

export type NotificationFilterType = 'ALL' | NotificationType;

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  unread?: boolean;
  search?: string;
}
