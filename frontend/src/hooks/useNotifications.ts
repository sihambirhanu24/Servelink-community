'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
} from '@/services/notification';
import type { NotificationQueryParams } from '@/types/notification';

export const NOTIFICATIONS_KEY = 'notifications-list';
export const UNREAD_COUNT_KEY = 'notifications-unread-count';

export function useNotifications(params: NotificationQueryParams = {}) {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: [NOTIFICATIONS_KEY, params],
    queryFn: () => fetchNotifications(params),
    staleTime: 30_000,
    retry: 1,
    // Skip the query if there's no token (e.g., on page refresh before auth context initializes)
    enabled: !!token,
  });
}

export function useNotificationsInfinite(params: Omit<NotificationQueryParams, 'page'> = {}) {
  const { token } = useAuth();
  
  return useInfiniteQuery({
    queryKey: [NOTIFICATIONS_KEY, 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      fetchNotifications({ ...params, page: pageParam as number, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    staleTime: 30_000,
    // Skip the query if there's no token
    enabled: !!token,
  });
}

export function useUnreadCount() {
  const { token } = useAuth();
  
  return useQuery({
    queryKey: [UNREAD_COUNT_KEY],
    queryFn: fetchUnreadCount,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: 1,
    // Skip the query if there's no token (e.g., in admin panel without teacher login)
    enabled: !!token,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.setQueriesData(
        { queryKey: [NOTIFICATIONS_KEY] },
        (old: any) => {
          if (!old) return old;
          if (old.data) {
            return {
              ...old,
              data: old.data.map((n: any) =>
                n.id === id ? { ...n, isRead: true } : n,
              ),
            };
          }
          if (old.pages) {
            return {
              ...old,
              pages: old.pages.map((page: any) => ({
                ...page,
                data: page.data.map((n: any) =>
                  n.id === id ? { ...n, isRead: true } : n,
                ),
              })),
            };
          }
          return old;
        },
      );
      return { snapshots };
    },
    onError: (_err, _id, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.setQueriesData(
        { queryKey: [NOTIFICATIONS_KEY] },
        (old: any) => {
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
        },
      );
      return { snapshots };
    },
    onError: (_err, _vars, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_KEY] });
      const snapshots = queryClient.getQueriesData({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.setQueriesData(
        { queryKey: [NOTIFICATIONS_KEY] },
        (old: any) => {
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
        },
      );
      return { snapshots };
    },
    onError: (_err, _id, context: any) => {
      context?.snapshots?.forEach(([key, value]: any) => {
        queryClient.setQueryData(key, value);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}

export function useClearRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearReadNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_KEY] });
    },
  });
}
