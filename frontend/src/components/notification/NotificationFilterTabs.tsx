'use client';

import { motion } from 'framer-motion';
import type { NotificationFilterType } from '@/types/notification';

interface Tab {
  label: string;
  value: NotificationFilterType;
}

const TABS: Tab[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Unread', value: 'ALL' },
  { label: 'Likes', value: 'LIKE' },
  { label: 'Comments', value: 'COMMENT' },
  { label: 'Bookmarks', value: 'BOOKMARK' },
  { label: 'Communities', value: 'COMMUNITY_JOIN' },
  { label: 'System', value: 'SYSTEM' },
];

interface NotificationFilterTabsProps {
  activeFilter: NotificationFilterType;
  showUnreadOnly: boolean;
  onFilterChange: (filter: NotificationFilterType, unreadOnly: boolean) => void;
}

export function NotificationFilterTabs({
  activeFilter,
  showUnreadOnly,
  onFilterChange,
}: NotificationFilterTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
      {TABS.map((tab) => {
        const isActive =
          tab.label === 'Unread'
            ? showUnreadOnly
            : activeFilter === tab.value && (tab.label !== 'All' || !showUnreadOnly);

        return (
          <button
            key={tab.label}
            onClick={() => {
              if (tab.label === 'Unread') {
                onFilterChange('ALL', true);
              } else if (tab.label === 'All') {
                onFilterChange('ALL', false);
              } else {
                onFilterChange(tab.value, false);
              }
            }}
            className={`relative shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#043658]/30 ${
              isActive
                ? 'text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="notification-filter-pill"
                className="absolute inset-0 rounded-full bg-[#043658]"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
