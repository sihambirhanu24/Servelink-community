'use client';

import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationContext } from '@/context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const { toggleDropdown, unreadCount, isDropdownOpen } = useNotificationContext();

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="dialog"
        className="relative rounded-full p-2 text-gray-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
      >
        <Bell className="h-5 w-5" />

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#043658] px-1 text-[9px] font-bold text-white leading-none"
              aria-hidden="true"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <NotificationDropdown />
    </div>
  );
}
