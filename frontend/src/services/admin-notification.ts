import api from '@/lib/axios';
import type {
  AdminNotification,
  AdminNotificationsResponse,
  AdminUnreadCountResponse,
  AdminNotificationQueryParams,
} from '@/types/admin-notification';

const ADMIN_TOKEN_KEY = 'admin_token';

// Helper to get admin token
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

// Helper to create admin API instance with admin token
function getAdminApi() {
  const token = getAdminToken();
  return {
    get: <T>(url: string, config?: any) =>
      api.get<T>(url, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      }),
    post: <T>(url: string, data?: any, config?: any) =>
      api.post<T>(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      }),
    patch: <T>(url: string, data?: any, config?: any) =>
      api.patch<T>(url, data, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      }),
    delete: <T>(url: string, config?: any) =>
      api.delete<T>(url, {
        ...config,
        headers: {
          ...config?.headers,
          Authorization: token ? `Bearer ${token}` : '',
        },
      }),
  };
}

export async function fetchAdminNotifications(
  params: AdminNotificationQueryParams = {},
): Promise<AdminNotificationsResponse> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.get<AdminNotificationsResponse>('/admin/notifications', {
    params,
  });
  return data;
}

export async function fetchAdminUnreadCount(): Promise<AdminUnreadCountResponse> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.get<AdminUnreadCountResponse>('/admin/notifications/unread-count');
  return data;
}

export async function markAdminNotificationRead(id: string): Promise<AdminNotification> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.patch<AdminNotification>(`/admin/notifications/${id}/read`);
  return data;
}

export async function markAdminNotificationUnread(id: string): Promise<AdminNotification> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.patch<AdminNotification>(`/admin/notifications/${id}/unread`);
  return data;
}

export async function markAllAdminNotificationsRead(): Promise<{ success: boolean }> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.patch<{ success: boolean }>('/admin/notifications/read-all');
  return data;
}

export async function deleteAdminNotification(id: string): Promise<{ success: boolean }> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.delete<{ success: boolean }>(`/admin/notifications/${id}`);
  return data;
}

export async function clearReadAdminNotifications(): Promise<{ success: boolean }> {
  const adminApi = getAdminApi();
  const { data } = await adminApi.delete<{ success: boolean }>('/admin/notifications/clear');
  return data;
}
