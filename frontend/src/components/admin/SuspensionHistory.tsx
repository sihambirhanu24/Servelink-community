'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, Ban, AlertTriangle, X, ShieldCheck } from 'lucide-react';
import { getTeacherSuspensionHistory } from '@/services/admin';
import { getErrorMessage } from '@/lib/error-message';
import type { SuspensionHistoryItem } from '@/types/admin';

interface SuspensionHistoryProps {
  teacherId: string;
  teacherName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const suspensionHistoryQueryKey = (teacherId: string) => ['teacher-suspension-history', teacherId] as const;

const TYPE_STYLES: Record<SuspensionHistoryItem['suspensionType'], { className: string; icon: React.ReactNode; label: string }> = {
  WARNING: {
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    label: 'Warning',
  },
  TEMPORARY: {
    className: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <Clock className="w-3.5 h-3.5" />,
    label: 'Temporary',
  },
  PERMANENT: {
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: <Ban className="w-3.5 h-3.5" />,
    label: 'Permanent',
  },
};

const STATUS_STYLES: Record<SuspensionHistoryItem['status'], { className: string; label: string }> = {
  ACTIVE: { className: 'bg-red-50 text-red-700 border-red-200', label: 'Active' },
  COMPLETED: { className: 'bg-green-50 text-green-700 border-green-200', label: 'Completed' },
  WARNING: { className: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Warning' },
};

const formatDate = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Duration of the suspension: scheduled length for temporary suspensions,
 * actual served time when lifted early, "Permanent" when open-ended.
 */
const getDuration = (item: SuspensionHistoryItem) => {
  if (item.suspensionType === 'WARNING') return '—';
  const start = new Date(item.suspendedAt).getTime();
  const end = item.restoredAt
    ? new Date(item.restoredAt).getTime()
    : item.suspendedUntil
      ? new Date(item.suspendedUntil).getTime()
      : null;
  if (end === null) return 'Permanent';
  const hours = Math.max(0, Math.round((end - start) / (1000 * 60 * 60)));
  if (hours < 24) return hours <= 1 ? '< 1 hour' : `${hours} hours`;
  const days = Math.round(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''}`;
};

export default function SuspensionHistory({ teacherId, teacherName, isOpen, onClose }: SuspensionHistoryProps) {
  const { data: history = [], isLoading, error } = useQuery({
    queryKey: suspensionHistoryQueryKey(teacherId),
    queryFn: () => getTeacherSuspensionHistory(teacherId),
    enabled: isOpen && !!teacherId,
  });

  if (!isOpen) return null;

  const errorMessage = error ? getErrorMessage(error, 'Failed to load suspension history') : null;

  const suspensionCount = history.filter((h) => h.suspensionType !== 'WARNING').length;
  const warningCount = history.length - suspensionCount;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Suspension History</h2>
              <p className="text-sm text-gray-500 mt-1">{teacherName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-600">Loading suspension history...</div>
            </div>
          ) : errorMessage ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{errorMessage}</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suspension History</h3>
              <p className="text-gray-500">This teacher has never been warned or suspended.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3">Ended</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item) => {
                    const type = TYPE_STYLES[item.suspensionType];
                    const status = STATUS_STYLES[item.status];
                    return (
                      <tr key={item.id} className="align-top hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{item.suspendedByName ?? 'Admin'}</p>
                          {item.restoredBy && item.restoredByName && item.suspensionType !== 'WARNING' && (
                            <p className="text-xs text-gray-500 mt-0.5">Lifted by {item.restoredByName}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${type.className}`}
                          >
                            {type.icon}
                            {type.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-gray-800 whitespace-pre-wrap break-words">{item.reason}</p>
                          {item.reportId && (
                            <p className="text-xs text-gray-500 mt-1">Report: {item.reportId}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap" title={formatDateTime(item.suspendedAt)}>
                          {formatDate(item.suspendedAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap" title={formatDateTime(item.endedAt)}>
                          {item.suspensionType === 'WARNING'
                            ? '—'
                            : item.endedAt
                              ? formatDate(item.endedAt)
                              : 'Permanent'}
                        </td>
                        <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{getDuration(item)}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 mt-auto">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Suspensions: <span className="font-medium text-gray-900">{suspensionCount}</span>
              <span className="mx-2 text-gray-300">|</span>
              Warnings: <span className="font-medium text-gray-900">{warningCount}</span>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
