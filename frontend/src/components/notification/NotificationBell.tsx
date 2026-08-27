'use client';

import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationContext } from '@/context/NotificationContext';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const { toggleDropdown, unreadCount, isDropdownOpen } =
    useNotificationContext();

  return (
    <div className="relative">
      {/*
        Button — circular hover ring in white/10 (matches the Topbar's
        ChatRoomsDropdown hover).  The badge uses the ServeLink gold (#FFC107)
        with navy text to be consistent with the brand and clearly visible on
        the dark navy Topbar.
      */}
      <button
        onClick={toggleDropdown}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="dialog"
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-white
          transition-all
          duration-200
          hover:bg-white/10
          focus:outline-none
          focus:ring-2
          focus:ring-[#FFC107]/40
        "
      >
        {/* Bell icon — slightly animated when there are unread items */}
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -8, 8, -5, 5, 0] } : {}}
          transition={{ duration: 0.6, repeat: 0 }}
          key={unreadCount}
        >
          <Bell className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </motion.div>

        {/* Unread count badge — gold pill, small, doesn't dominate navbar */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 28 }}
              className="
                pointer-events-none
                absolute
                -right-0.5
                -top-0.5
                flex
                h-[18px]
                min-w-[18px]
                items-center
                justify-center
                rounded-full
                bg-[#FFC107]
                px-1
                text-[9px]
                font-bold
                leading-none
                text-[#043658]
                shadow-sm
                ring-2
                ring-[#043658]
              "
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
