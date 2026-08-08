'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { NotificationMeta } from '@/types/notification';

interface NotificationPaginationProps {
  meta: NotificationMeta;
  onPageChange: (page: number) => void;
}

export function NotificationPagination({ meta, onPageChange }: NotificationPaginationProps) {
  if (meta.totalPages <= 1) return null;

  const pages = Array.from({ length: meta.totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    (p) => p === 1 || p === meta.totalPages || Math.abs(p - meta.page) <= 1,
  );

  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
      <p className="text-sm text-gray-500">
        Showing{' '}
        <span className="font-medium text-gray-800">
          {(meta.page - 1) * meta.limit + 1}–
          {Math.min(meta.page * meta.limit, meta.total)}
        </span>{' '}
        of <span className="font-medium text-gray-800">{meta.total}</span>
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          onClick={() => onPageChange(meta.page - 1)}
          disabled={!meta.hasPreviousPage}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages.map((page, i) => {
          const prev = visiblePages[i - 1];
          const showEllipsis = prev !== undefined && page - prev > 1;

          return (
            <span key={page} className="flex items-center gap-1">
              {showEllipsis && (
                <span className="px-1 text-sm text-gray-400">…</span>
              )}
              <button
                onClick={() => onPageChange(page)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#043658]/30 ${
                  page === meta.page
                    ? 'bg-[#043658] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-current={page === meta.page ? 'page' : undefined}
              >
                {page}
              </button>
            </span>
          );
        })}

        <button
          onClick={() => onPageChange(meta.page + 1)}
          disabled={!meta.hasNextPage}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
