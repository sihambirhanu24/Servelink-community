'use client';

import { useEffect, useState } from 'react';
import { Clock, Ban, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SuspensionHistoryItem {
  id: string;
  suspensionType: 'WARNING' | 'TEMPORARY' | 'PERMANENT';
  reason: string;
  suspendedBy: string;
  suspendedAt: string;
  suspendedUntil: string | null;
  restoredAt: string | null;
  restoredBy: string | null;
  reportId: string | null;
}

interface SuspensionHistoryProps {
  teacherId: string;
  teacherName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function SuspensionHistory({
  teacherId,
  teacherName,
  isOpen,
  onClose,
}: SuspensionHistoryProps) {
  const [history, setHistory] = useState<SuspensionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuspensionHistory();
    }
  }, [isOpen, teacherId]);

  const fetchSuspensionHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(
        `${API_URL}/admin/suspension/${teacherId}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load suspension history');
    } finally {
      setLoading(false);
    }
  };

  const getSuspensionTypeBadge = (type: string) => {
    const styles = {
      WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      TEMPORARY: 'bg-orange-100 text-orange-800 border-orange-200',
      PERMANENT: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      WARNING: <AlertTriangle className="w-4 h-4" />,
      TEMPORARY: <Clock className="w-4 h-4" />,
      PERMANENT: <Ban className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[type as keyof typeof styles]}`}
      >
        {icons[type as keyof typeof icons]}
        {type}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDuration = (suspendedAt: string, suspendedUntil: string | null) => {
    if (!suspendedUntil) return 'Permanent';
    const start = new Date(suspendedAt);
    const end = new Date(suspendedUntil);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Suspension History</h2>
              <p className="text-sm text-gray-500 mt-1">{teacherName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-gray-600">Loading suspension history...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Suspension History</h3>
              <p className="text-gray-500">This teacher has no previous suspensions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-center gap-3">
                        {getSuspensionTypeBadge(item.suspensionType)}
                        <span className="text-sm text-gray-500">
                          {formatDate(item.suspendedAt)}
                        </span>
                        {item.restoredAt ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Restored
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-600">
                            <XCircle className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <h4 className="font-medium text-gray-900">Reason</h4>
                        <p className="text-sm text-gray-600 mt-1">{item.reason}</p>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {getDuration(item.suspendedAt, item.suspendedUntil)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Suspended By:</span>
                          <span className="ml-2 font-medium text-gray-900">{item.suspendedBy}</span>
                        </div>
                        {item.suspendedUntil && (
                          <div>
                            <span className="text-gray-500">Suspended Until:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {formatDate(item.suspendedUntil)}
                            </span>
                          </div>
                        )}
                        {item.restoredAt && (
                          <div>
                            <span className="text-gray-500">Restored At:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {formatDate(item.restoredAt)}
                            </span>
                          </div>
                        )}
                        {item.restoredBy && (
                          <div>
                            <span className="text-gray-500">Restored By:</span>
                            <span className="ml-2 font-medium text-gray-900">{item.restoredBy}</span>
                          </div>
                        )}
                        {item.reportId && (
                          <div>
                            <span className="text-gray-500">Related Report:</span>
                            <span className="ml-2 font-medium text-gray-900">{item.reportId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Total suspensions: <span className="font-medium text-gray-900">{history.length}</span>
            </p>
            <button
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
