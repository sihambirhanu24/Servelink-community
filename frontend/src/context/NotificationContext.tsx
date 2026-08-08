'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { useUnreadCount } from '@/hooks/useNotifications';
import { UNREAD_COUNT_KEY } from '@/hooks/useNotifications';
import type { Notification } from '@/types/notification';

interface NotificationContextType {
  isDropdownOpen: boolean;
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;
  unreadCount: number;
  latestNotification: Notification | null;
}

const NotificationContext = createContext<NotificationContextType>({
  isDropdownOpen: false,
  openDropdown: () => {},
  closeDropdown: () => {},
  toggleDropdown: () => {},
  unreadCount: 0,
  latestNotification: null,
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const handleNewNotification = useCallback(
    (notification: Notification) => {
      setLatestNotification(notification);
      queryClient.setQueryData([UNREAD_COUNT_KEY], (old: any) => ({
        count: (old?.count ?? 0) + 1,
      }));
      toast(notification.title, {
        description: notification.message,
        duration: 4000,
      });
    },
    [queryClient],
  );

  useNotificationSocket({ token, onNewNotification: handleNewNotification });

  const openDropdown = useCallback(() => setIsDropdownOpen(true), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const toggleDropdown = useCallback(() => setIsDropdownOpen((v) => !v), []);

  return (
    <NotificationContext.Provider
      value={{
        isDropdownOpen,
        openDropdown,
        closeDropdown,
        toggleDropdown,
        unreadCount,
        latestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
