'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Clock, Lock, ExternalLink, Send, X, CheckCircle, XCircle, Hourglass } from 'lucide-react';
import { useSuspensionStatus } from '@/hooks/useSuspensionStatus';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/axios';
import { toast } from 'sonner';

interface Appeal {
  id: string;
  subject: string;
  explanation: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedAt: string | null;
  adminResponse: string | null;
}

export default function SuspensionDetailsCard() {
  const { user } = useAuth();
  const teacherId = user?.id;
  const { suspensionStatus, loading, refresh } = useSuspensionStatus(teacherId);
  const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [loadingAppeal, setLoadingAppeal] = useState(false);

  useEffect(() => {
    if (suspensionStatus?.isSuspended && teacherId) {
      fetchAppeal();
    }
  }, [suspensionStatus?.isSuspended, teacherId]);

  const fetchAppeal = async () => {
    setLoadingAppeal(true);
    try {
      const response = await api.get('/suspension/appeals/my-appeal');
      if (response.data) {
        setAppeal(response.data);
      }
    } catch (error) {
      // No appeal exists or error fetching
      setAppeal(null);
    } finally {
      setLoadingAppeal(false);
    }
  };

  if (loading || !suspensionStatus || !suspensionStatus.isSuspended) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Permanent';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!suspensionStatus.suspensionUntil) return 'Permanent';
    if (suspensionStatus.remainingDays === 0) return 'Expired';
    return `${suspensionStatus.remainingDays} day${suspensionStatus.remainingDays !== 1 ? 's' : ''}`;
  };

  const handleSubmitAppeal = async () => {
    if (!appealMessage.trim()) {
      toast.error('Please provide an explanation for your appeal.');
      return;
    }

    if (appealMessage.length < 50) {
      toast.error('Please provide at least 50 characters for your appeal.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/suspension/appeals', {
        subject: 'Appeal for Account Suspension',
        explanation: appealMessage,
      });
      toast.success('Appeal submitted successfully. An administrator will review your request.');
      setIsAppealModalOpen(false);
      setAppealMessage('');
      refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit appeal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 mb-1">Account Suspension</h3>
            <p className="text-sm text-red-700">
              Your teacher account has been temporarily suspended.
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-red-600">Status</span>
              <p className="text-sm font-semibold text-red-900">
                {suspensionStatus.status === 'PERMANENTLY_SUSPENDED' ? 'Permanent' : 'Temporary'}
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-red-600">Suspended On</span>
              <p className="text-sm font-semibold text-red-900">
                {formatDate(suspensionStatus.suspensionStart)}
              </p>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-red-600">Reason</span>
            <p className="text-sm font-semibold text-red-900">
              {suspensionStatus.suspensionReason || 'Policy violation'}
            </p>
          </div>

          {suspensionStatus.suspensionUntil && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-medium text-red-600">Suspension Ends</span>
                <p className="text-sm font-semibold text-red-900">
                  {formatDate(suspensionStatus.suspensionUntil)}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-red-600">Remaining</span>
                <p className="text-sm font-semibold text-red-900">
                  {getDaysRemaining()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-red-100 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-red-700 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-red-800">
              <p className="font-semibold mb-1">Restrictions</p>
              <p>
                Community participation is temporarily disabled. You cannot create posts, comment, like, or access protected community features while your account is suspended.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {appeal ? (
            <button
              onClick={() => setIsAppealModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {appeal.status === 'PENDING' ? (
                <>
                  <Hourglass className="h-3.5 w-3.5" />
                  View Appeal
                </>
              ) : appeal.status === 'APPROVED' ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  View Decision
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  View Decision
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setIsAppealModalOpen(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Appeal Suspension
            </button>
          )}
          <a
            href="/suspended"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
          >
            View Details
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Appeal Status */}
        {appeal && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-3">
              {appeal.status === 'PENDING' && (
                <Hourglass className="h-4 w-4 text-amber-600" />
              )}
              {appeal.status === 'APPROVED' && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              {appeal.status === 'REJECTED' && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm font-semibold text-gray-900">
                Suspension Appeal
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`font-semibold ${
                  appeal.status === 'PENDING' ? 'text-amber-600' :
                  appeal.status === 'APPROVED' ? 'text-green-600' :
                  'text-red-600'
                }`}>
                  {appeal.status === 'PENDING' ? 'Pending Review' :
                   appeal.status === 'APPROVED' ? 'Approved' :
                   'Rejected'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Submitted:</span>
                <span className="text-gray-900">
                  {new Date(appeal.submittedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>

              {appeal.reviewedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reviewed:</span>
                  <span className="text-gray-900">
                    {new Date(appeal.reviewedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {appeal.adminResponse && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-gray-500 block mb-1">Admin Decision:</span>
                  <p className="text-gray-900">{appeal.adminResponse}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Appeal Modal */}
      {isAppealModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Appeal Suspension</h2>
                <button
                  onClick={() => setIsAppealModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Suspension Reason
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  {suspensionStatus.suspensionReason || 'Policy violation'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you believe this suspension should be removed? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="Explain what happened and provide any relevant information that may help us review your case..."
                  rows={6}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-[#043658] focus:border-transparent"
                  maxLength={2000}
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Minimum 50 characters</span>
                  <span className="text-xs text-gray-500">{appealMessage.length}/2000</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  Please provide accurate information. Submitting multiple appeals for the same suspension is unnecessary.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSubmitAppeal}
                disabled={isSubmitting || appealMessage.length < 50}
                className="flex-1 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Appeal'}
              </button>
              <button
                onClick={() => setIsAppealModalOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
