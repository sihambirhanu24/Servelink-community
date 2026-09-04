'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, LogOut, FileText, CheckCircle2, XCircle, Info } from 'lucide-react';
import { api } from '@/lib/axios';
import { getErrorMessage } from '@/lib/error-message';
import { useAuth, isSuspendedStatus } from '@/context/AuthContext';

interface SuspensionStatus {
  status: string;
  suspensionReason: string | null;
  suspensionStart: string | null;
  suspensionUntil: string | null;
  suspendedBy: string | null;
  suspensionCount: number;
}

interface Appeal {
  id: string;
  subject: string;
  explanation: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminResponse: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface SuspensionScreenData {
  status: SuspensionStatus;
  latestAppeal: Appeal | null;
}

const SUSPENSION_SCREEN_KEY = ['suspension-screen'] as const;

// Both endpoints are explicitly marked @AllowSuspended on the backend.
async function fetchSuspensionScreen(): Promise<SuspensionScreenData> {
  const [statusRes, appealRes] = await Promise.all([
    api.get<SuspensionStatus>('/suspension/me/status'),
    api.get<Appeal | null>('/suspension/appeals/my-appeal').catch(() => ({ data: null })),
  ]);
  return { status: statusRes.data, latestAppeal: appealRes.data ?? null };
}

export default function SuspendedPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, isInitializing, logout } = useAuth();

  // Captured once per mount so "days remaining" is stable across re-renders.
  const [renderedAt] = useState(() => Date.now());
  const [showDetails, setShowDetails] = useState(false);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appealError, setAppealError] = useState<string | null>(null);
  const [appealForm, setAppealForm] = useState({ subject: '', explanation: '' });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: SUSPENSION_SCREEN_KEY,
    queryFn: fetchSuspensionScreen,
    enabled: !isInitializing && !!token,
    retry: false,
  });

  const suspensionStatus = data?.status ?? null;
  const latestAppeal = data?.latestAppeal ?? null;
  const unauthorized =
    !isInitializing && (!token || (error !== null && (error as { response?: { status?: number } }).response?.status === 401));
  // The backend synchronises expired temporary suspensions, so an ACTIVE
  // answer here means access has genuinely been restored.
  const accessRestored = !!suspensionStatus && !isSuspendedStatus(suspensionStatus.status);

  useEffect(() => {
    if (unauthorized) router.replace('/auth/login');
    else if (accessRestored) router.replace('/dashboard');
  }, [unauthorized, accessRestored, router]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setAppealError(null);
    setSubmitting(true);
    try {
      const { data: appeal } = await api.post<Appeal>('/suspension/appeals', {
        subject: appealForm.subject.trim(),
        explanation: appealForm.explanation.trim(),
      });
      queryClient.setQueryData<SuspensionScreenData | undefined>(SUSPENSION_SCREEN_KEY, (old) =>
        old ? { ...old, latestAppeal: appeal } : old,
      );
      setShowAppealForm(false);
      setAppealForm({ subject: '', explanation: '' });
    } catch (err) {
      setAppealError(getErrorMessage(err, 'Failed to submit appeal'));
    } finally {
      setSubmitting(false);
    }
  };

  const getDaysRemaining = () => {
    if (!suspensionStatus?.suspensionUntil) return null;
    const diff = new Date(suspensionStatus.suspensionUntil).getTime() - renderedAt;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (isInitializing || isLoading || unauthorized || accessRestored) {
    return (
      <div className="min-h-screen bg-[#F5F8FB] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !suspensionStatus) {
    return (
      <div className="min-h-screen bg-[#F5F8FB] flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-red-600">{getErrorMessage(error, 'Failed to load suspension status')}</div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#043658]/90"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
          >
            Log out
          </button>
        </div>
      </div>
    );
  }

  const isPermanent = suspensionStatus?.status === 'PERMANENTLY_SUSPENDED';
  const daysRemaining = getDaysRemaining();
  const hasPendingAppeal = latestAppeal?.status === 'PENDING';
  const canAppeal = !hasPendingAppeal;

  return (
    <div className="min-h-screen bg-[#F5F8FB] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Account Suspended</h1>
                <p className="text-white/90 mt-1">
                  Your ServeLink account is currently suspended
                  {isPermanent ? ' permanently.' : '.'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Suspension Reason */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Reason</h3>
                <p className="text-red-800 whitespace-pre-wrap">
                  {suspensionStatus?.suspensionReason || 'No reason provided'}
                </p>
              </div>

              {/* Suspension Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Suspended on</span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(suspensionStatus?.suspensionStart ?? null)}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Suspended until</span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {isPermanent
                      ? 'Permanent'
                      : suspensionStatus?.suspensionUntil
                        ? formatDate(suspensionStatus.suspensionUntil)
                        : 'Lifted by an admin'}
                  </p>
                </div>
              </div>

              {/* Days Remaining */}
              {!isPermanent && daysRemaining !== null && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-orange-900">Time remaining</h3>
                      <p className="text-orange-700 text-sm">
                        {daysRemaining > 0
                          ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining. Access is restored automatically.`
                          : 'Your suspension is ending. Access will be restored on your next request.'}
                      </p>
                    </div>
                    {daysRemaining > 0 && (
                      <div className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-xl">
                        {daysRemaining}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Details toggle */}
              <button
                type="button"
                onClick={() => setShowDetails((v) => !v)}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Info className="w-4 h-4" />
                {showDetails ? 'Hide suspension details' : 'View suspension details'}
              </button>

              {showDetails && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                  <p>
                    <span className="font-medium text-gray-900">Type:</span>{' '}
                    {isPermanent ? 'Permanent suspension' : 'Temporary suspension'}
                  </p>
                  <p>
                    <span className="font-medium text-gray-900">Suspensions on this account:</span>{' '}
                    {suspensionStatus?.suspensionCount ?? 1}
                  </p>
                  <p>
                    While suspended you cannot post, comment, react, message, host or join live sessions, or use other
                    protected ServeLink features. You can still read this page and submit an appeal.
                  </p>
                </div>
              )}

              {/* Latest appeal status */}
              {latestAppeal && (
                <div
                  className={`rounded-lg border p-4 ${
                    latestAppeal.status === 'PENDING'
                      ? 'bg-yellow-50 border-yellow-200'
                      : latestAppeal.status === 'APPROVED'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {latestAppeal.status === 'PENDING' ? (
                      <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                    ) : latestAppeal.status === 'APPROVED' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {latestAppeal.status === 'PENDING'
                          ? 'Appeal under review'
                          : latestAppeal.status === 'APPROVED'
                            ? 'Appeal approved'
                            : 'Appeal rejected'}
                      </h3>
                      <p className="text-sm text-gray-700 mt-1">
                        &ldquo;{latestAppeal.subject}&rdquo; &middot; submitted {formatDate(latestAppeal.createdAt)}
                      </p>
                      {latestAppeal.adminResponse && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Moderation team:</span> {latestAppeal.adminResponse}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appeal Section */}
              {canAppeal && !showAppealForm && (
                <button
                  type="button"
                  onClick={() => setShowAppealForm(true)}
                  className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#043658] font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-5 h-5" />
                  {latestAppeal ? 'Submit another appeal' : 'Submit an appeal'}
                </button>
              )}

              {/* Appeal Form */}
              {showAppealForm && (
                <form onSubmit={handleSubmitAppeal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={appealForm.subject}
                      onChange={(e) => setAppealForm({ ...appealForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
                      placeholder="Brief description of your appeal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                    <textarea
                      required
                      rows={5}
                      value={appealForm.explanation}
                      onChange={(e) => setAppealForm({ ...appealForm, explanation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
                      placeholder="Explain why you believe your suspension should be lifted"
                    />
                  </div>
                  {appealError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm" role="alert">
                      {appealError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#043658] font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setShowAppealForm(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-6">
          If you believe this suspension is an error, please contact the ServeLink support team.
        </p>
      </div>
    </div>
  );
}
