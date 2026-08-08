'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types/notification';

interface UseNotificationSocketOptions {
  token: string | null;
  onNewNotification?: (n: Notification) => void;
}

export function useNotificationSocket({
  token,
  onNewNotification,
}: UseNotificationSocketOptions) {
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

    socket.on('notification', (notification: Notification) => {
      queryClient.setQueryData<{ pages: { data: Notification[]; meta: unknown }[] }>(
        ['notifications'],
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
      queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
      onNewNotification?.(notification);
    });

    socket.on('unread-count-update', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient, onNewNotification]);

  return socketRef;
}
