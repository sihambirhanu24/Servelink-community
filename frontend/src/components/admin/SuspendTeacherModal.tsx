'use client';

import { useState } from 'react';
import { AlertTriangle, X, Clock, Ban } from 'lucide-react';
import { suspendTeacher } from '@/services/admin';
import { getErrorMessage } from '@/lib/error-message';
import type { SuspensionType, Teacher } from '@/types/admin';

interface SuspendTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  /** Receives the updated teacher returned by the backend. */
  onSuccess: (teacher: Teacher, suspensionType: SuspensionType) => void;
  reportId?: string;
}

const DURATION_PRESETS = [1, 3, 7, 14, 30];

export default function SuspendTeacherModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onSuccess,
  reportId,
}: SuspendTeacherModalProps) {
  const [suspensionType, setSuspensionType] = useState<SuspensionType>('TEMPORARY');
  const [duration, setDuration] = useState<number>(7);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setSuspensionType('TEMPORARY');
    setDuration(7);
    setReason('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (reason.trim().length < 3) {
      setError('Please provide a reason for the suspension (at least 3 characters)');
      return;
    }

    if (suspensionType === 'TEMPORARY' && (!duration || duration < 1 || duration > 365)) {
      setError('Please provide a duration between 1 and 365 days');
      return;
    }

    setLoading(true);

    try {
      const updated = await suspendTeacher(teacherId, {
        suspensionType,
        reason: reason.trim(),
        durationDays: suspensionType === 'TEMPORARY' ? duration : undefined,
        reportId,
      });

      onSuccess(updated, suspensionType);
      resetForm();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to suspend teacher'));
    } finally {
      setLoading(false);
    }
  };

  const submitLabel =
    suspensionType === 'WARNING' ? 'Send Warning' : 'Suspend Teacher';
  const loadingLabel =
    suspensionType === 'WARNING' ? 'Sending...' : 'Suspending...';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Suspend Teacher</h2>
                <p className="text-sm text-gray-500">{teacherName}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Suspension Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Suspension Type
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setSuspensionType('WARNING')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  suspensionType === 'WARNING'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  <span className="text-sm font-medium">Warning</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSuspensionType('TEMPORARY')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  suspensionType === 'TEMPORARY'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Clock className="w-6 h-6 text-orange-600" />
                  <span className="text-sm font-medium">Temporary</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSuspensionType('PERMANENT')}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  suspensionType === 'PERMANENT'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Ban className="w-6 h-6 text-red-600" />
                  <span className="text-sm font-medium">Permanent</span>
                </div>
              </button>
            </div>
          </div>

          {/* Duration (for temporary suspension) */}
          {suspensionType === 'TEMPORARY' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Suspension Duration
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {DURATION_PRESETS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDuration(days)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                      duration === days
                        ? 'border-orange-500 bg-orange-50 text-orange-800'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {days} day{days !== 1 ? 's' : ''}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="365"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
                placeholder="Enter number of days"
              />
              <p className="mt-1 text-sm text-gray-500">
                Access is restored automatically after {duration} day{duration !== 1 ? 's' : ''}.
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
              placeholder="Provide a clear reason. The teacher will see this."
            />
          </div>

          {/* Warning */}
          <div
            className={`rounded-lg border p-4 ${
              suspensionType === 'WARNING'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={`w-5 h-5 mt-0.5 ${
                  suspensionType === 'WARNING' ? 'text-yellow-600' : 'text-red-600'
                }`}
              />
              <div>
                <h4
                  className={`font-semibold ${
                    suspensionType === 'WARNING' ? 'text-yellow-900' : 'text-red-900'
                  }`}
                >
                  Important
                </h4>
                <p
                  className={`text-sm mt-1 ${
                    suspensionType === 'WARNING' ? 'text-yellow-800' : 'text-red-700'
                  }`}
                >
                  {suspensionType === 'WARNING'
                    ? 'A warning is recorded in the suspension history and the teacher is notified. It does not restrict access.'
                    : suspensionType === 'PERMANENT'
                      ? 'This teacher will immediately lose access to protected ServeLink features. Permanent suspensions are never lifted automatically; only an admin can restore the account.'
                      : 'This teacher will immediately lose access to protected ServeLink features, including any session they are currently signed in to. They will be notified and can submit an appeal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm" role="alert">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                suspensionType === 'WARNING'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {loading ? loadingLabel : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
