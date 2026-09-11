'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import {
  fetchAdminNotifications,
  fetchAdminUnreadCount,
  markAdminNotificationRead,
  markAdminNotificationUnread,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  clearReadAdminNotifications,
} from '@/services/admin-notification';
import type { AdminNotificationQueryParams } from '@/types/admin-notification';

export const ADMIN_NOTIFICATIONS_KEY = 'admin-notifications-list';
export const ADMIN_UNREAD_COUNT_KEY = 'admin-notifications-unread-count';

// Check if user is admin (has admin_token)
function hasAdminToken(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('admin_token');
}

export function useAdminNotifications(params: AdminNotificationQueryParams = {}) {
  return useQuery({
    queryKey: [ADMIN_NOTIFICATIONS_KEY, params],
    queryFn: () => fetchAdminNotifications(params),
    staleTime: 30_000,
    retry: 1,
    enabled: hasAdminToken(),
  });
}

export function useAdminNotificationsInfinite(
  params: Omit<AdminNotificationQueryParams, 'page'> = {},
) {
  return useInfiniteQuery({
    queryKey: [ADMIN_NOTIFICATIONS_KEY, 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      fetchAdminNotifications({ ...params, page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: 30_000,
    enabled: hasAdminToken(),
  });
}

export function useAdminUnreadCount() {
  return useQuery({
    queryKey: [ADMIN_UNREAD_COUNT_KEY],
    queryFn: fetchAdminUnreadCount,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
    enabled: hasAdminToken(),
  });
}

export function useMarkAdminRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAdminNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      queryClient.setQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] }, (old: any) => {
        if (!old) return old;
        if (old.data) {
          return {
            ...old,
            data: old.data.map((n: any) => (n.id === id ? { ...n, isRead: true } : n)),
          };
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: any) => (n.id === id ? { ...n, isRead: true } : n)),
            })),
          };
        }
        return old;
      });
      return { snapshots };
    },
    onError: (_err, _id, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_COUNT_KEY] });
    },
  });
}

export function useMarkAdminUnread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAdminNotificationUnread,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      queryClient.setQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] }, (old: any) => {
        if (!old) return old;
        if (old.data) {
          return {
            ...old,
            data: old.data.map((n: any) => (n.id === id ? { ...n, isRead: false } : n)),
          };
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: any) => (n.id === id ? { ...n, isRead: false } : n)),
            })),
          };
        }
        return old;
      });
      return { snapshots };
    },
    onError: (_err, _id, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_COUNT_KEY] });
    },
  });
}

export function useMarkAllAdminRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAdminNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      queryClient.setQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] }, (old: any) => {
        if (!old) return old;
        if (old.data) {
          return { ...old, data: old.data.map((n: any) => ({ ...n, isRead: true })) };
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.map((n: any) => ({ ...n, isRead: true })),
            })),
          };
        }
        return old;
      });
      return { snapshots };
    },
    onError: (_err, _vars, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_COUNT_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
    },
  });
}

export function useDeleteAdminNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAdminNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      queryClient.setQueriesData({ queryKey: [ADMIN_NOTIFICATIONS_KEY] }, (old: any) => {
        if (!old) return old;
        if (old.data) {
          return { ...old, data: old.data.filter((n: any) => n.id !== id) };
        }
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              data: page.data.filter((n: any) => n.id !== id),
            })),
          };
        }
        return old;
      });
      return { snapshots };
    },
    onError: (_err, _id, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_COUNT_KEY] });
    },
  });
}

export function useClearReadAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearReadAdminNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_UNREAD_COUNT_KEY] });
    },
  });
}
