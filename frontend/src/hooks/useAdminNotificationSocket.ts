'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type { AdminNotification } from '@/types/admin-notification';

interface UseAdminNotificationSocketOptions {
  token: string | null;
  onNewNotification?: (n: AdminNotification) => void;
}

export function useAdminNotificationSocket({
  token,
  onNewNotification,
}: UseAdminNotificationSocketOptions) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    // Listen for admin notifications
    socket.on('admin-notification', (notification: AdminNotification) => {
      queryClient.setQueryData<{ pages: { data: AdminNotification[]; meta: unknown }[] }>(
        ['admin-notifications-list'],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page, i) =>
              i === 0 ? { ...page, data: [notification, ...page.data] } : page,
            ),
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-list'] });
      onNewNotification?.(notification);
    });

    // Listen for admin unread count updates
    socket.on('admin-unread-count-update', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-unread-count'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient, onNewNotification]);

  return socketRef;
}
