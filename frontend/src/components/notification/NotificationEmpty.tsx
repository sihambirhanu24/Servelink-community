'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';

interface NotificationEmptyProps {
  isFiltered?: boolean;
}

export function NotificationEmpty({ isFiltered = false }: NotificationEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[#043658]/8">
        <Bell className="h-9 w-9 text-[#043658]/40" strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-gray-800">
        {isFiltered ? 'No matching notifications' : 'No notifications yet'}
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-gray-500">
        {isFiltered
          ? 'Try adjusting your filters to see more notifications.'
          : "When someone likes, comments, or interacts with your content, you'll see it here."}
      </p>
      {!isFiltered && (
        <Link
          href="/community"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
        >
          Go to Community Feed
        </Link>
      )}
    </motion.div>
  );
}
