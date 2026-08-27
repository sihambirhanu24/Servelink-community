'use client';

import { useState } from 'react';
import { AlertTriangle, X, Clock, Ban } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SuspendTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  onSuccess: () => void;
  reportId?: string;
}

export default function SuspendTeacherModal({
  isOpen,
  onClose,
  teacherId,
  teacherName,
  onSuccess,
  reportId,
}: SuspendTeacherModalProps) {
  const [suspensionType, setSuspensionType] = useState<'WARNING' | 'TEMPORARY' | 'PERMANENT'>('TEMPORARY');
  const [duration, setDuration] = useState<number>(7);
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError('Please provide a reason for the suspension');
      return;
    }

    if (suspensionType === 'TEMPORARY' && (!duration || duration < 1)) {
      setError('Please provide a valid duration');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(
        `${API_URL}/admin/suspension/suspend`,
        {
          teacherId,
          suspensionType,
          reason,
          duration: suspensionType === 'TEMPORARY' ? duration : undefined,
          reportId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      onSuccess();
      onClose();
      // Reset form
      setSuspensionType('TEMPORARY');
      setDuration(7);
      setReason('');
      setAdminNotes('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend teacher');
    } finally {
      setLoading(false);
    }
  };

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
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                  <Clock className="w-6 h-6 text-yellow-600" />
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
                Suspension Duration (days)
              </label>
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
                The suspension will expire after {duration} day{duration !== 1 ? 's' : ''}.
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Suspension Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
              placeholder="Provide a clear reason for the suspension..."
            />
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
              placeholder="Additional notes for internal reference..."
            />
          </div>

          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900">Important</h4>
                <p className="text-sm text-red-700 mt-1">
                  {suspensionType === 'PERMANENT'
                    ? 'Permanent suspensions cannot be automatically lifted. Only an authorized admin can restore the account.'
                    : 'The teacher will be notified of the suspension and can submit an appeal.'}
                </p>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
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
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Suspending...' : 'Suspend Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
