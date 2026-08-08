import api from '@/lib/axios';
import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
  NotificationQueryParams,
} from '@/types/notification';

export async function fetchNotifications(
  params: NotificationQueryParams = {},
): Promise<NotificationsResponse> {
  const { data } = await api.get<NotificationsResponse>('/notifications', {
    params,
  });
  return data;
}

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const { data } = await api.get<UnreadCountResponse>('/notifications/unread-count');
  return data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const { data } = await api.patch<{ success: boolean }>('/notifications/read-all');
  return data;
}

export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>(`/notifications/${id}`);
  return data;
}

export async function clearReadNotifications(): Promise<{ success: boolean }> {
  const { data } = await api.delete<{ success: boolean }>('/notifications/clear');
  return data;
}

export async function adminBroadcastNotification(payload: {
  title: string;
  message: string;
  referenceId?: string;
}): Promise<{ sent: number }> {
  const { data } = await api.post<{ sent: number }>('/notifications/admin-send', payload);
  return data;
}
