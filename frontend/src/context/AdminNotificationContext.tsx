'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAdminNotificationSocket } from '@/hooks/useAdminNotificationSocket';
import { useAdminUnreadCount, ADMIN_UNREAD_COUNT_KEY } from '@/hooks/useAdminNotifications';
import type { AdminNotification } from '@/types/admin-notification';

interface AdminNotificationContextType {
  isDropdownOpen: boolean;
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;
  unreadCount: number;
  latestNotification: AdminNotification | null;
}

const AdminNotificationContext = createContext<AdminNotificationContextType>({
  isDropdownOpen: false,
  openDropdown: () => {},
  closeDropdown: () => {},
  toggleDropdown: () => {},
  unreadCount: 0,
  latestNotification: null,
});

interface AdminNotificationProviderProps {
  children: React.ReactNode;
}

export function AdminNotificationProvider({ children }: AdminNotificationProviderProps) {
  const queryClient = useQueryClient();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [latestNotification, setLatestNotification] = useState<AdminNotification | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Get admin token from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      setAdminToken(token);
    }
  }, []);

  // Only fetch unread count if admin has token
  const { data: unreadData } = useAdminUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const handleNewNotification = useCallback(
    (notification: AdminNotification) => {
      setLatestNotification(notification);
      queryClient.setQueryData([ADMIN_UNREAD_COUNT_KEY], (old: any) => ({
        count: (old?.count ?? 0) + 1,
      }));
      toast(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    },
    [queryClient],
  );

  useAdminNotificationSocket({ token: adminToken, onNewNotification: handleNewNotification });

  const openDropdown = useCallback(() => setIsDropdownOpen(true), []);
  const closeDropdown = useCallback(() => setIsDropdownOpen(false), []);
  const toggleDropdown = useCallback(() => setIsDropdownOpen((v) => !v), []);

  return (
    <AdminNotificationContext.Provider
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
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotificationContext() {
  return useContext(AdminNotificationContext);
}
