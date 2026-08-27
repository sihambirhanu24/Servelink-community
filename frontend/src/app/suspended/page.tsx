'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, LogOut, FileText, XCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SuspensionStatus {
  status: string;
  suspensionReason: string | null;
  suspensionStart: string | null;
  suspensionUntil: string | null;
  suspendedBy: string | null;
  suspensionCount: number;
}

export default function SuspendedPage() {
  const router = useRouter();
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealSubmitted, setAppealSubmitted] = useState(false);
  const [appealForm, setAppealForm] = useState({
    subject: '',
    explanation: '',
  });

  useEffect(() => {
    fetchSuspensionStatus();
  }, []);

  const fetchSuspensionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const teacherId = response.data.id;
      const suspensionResponse = await axios.get(
        `${API_URL}/admin/suspension/${teacherId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuspensionStatus(suspensionResponse.data);
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_SUSPENDED') {
        setSuspensionStatus(err.response.data);
      } else {
        setError('Failed to load suspension status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    router.push('/login');
  };

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/suspension/appeals`,
        appealForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppealSubmitted(true);
      setShowAppealForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit appeal');
    }
  };

  const getDaysRemaining = () => {
    if (!suspensionStatus?.suspensionUntil) return null;
    const now = new Date();
    const until = new Date(suspensionStatus.suspensionUntil);
    const diff = until.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F8FB] flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error && !suspensionStatus) {
    return (
      <div className="min-h-screen bg-[#F5F8FB] flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  const isPermanent = suspensionStatus?.status === 'PERMANENTLY_SUSPENDED';
  const daysRemaining = getDaysRemaining();

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
                  {isPermanent ? 'Permanent Suspension' : 'Temporary Suspension'}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Suspension Reason */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Reason for Suspension</h3>
                <p className="text-red-800">
                  {suspensionStatus?.suspensionReason || 'No reason provided'}
                </p>
              </div>

              {/* Suspension Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Suspended On</span>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {formatDate(suspensionStatus?.suspensionStart ?? null)}
                  </p>
                </div>

                {!isPermanent && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Expires On</span>
                    </div>
                    <p className="text-gray-900 font-semibold">
                      {formatDate(suspensionStatus?.suspensionUntil ?? null)}
                    </p>
                  </div>
                )}
              </div>

              {/* Days Remaining */}
              {!isPermanent && daysRemaining !== null && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-orange-900">Time Remaining</h3>
                      <p className="text-orange-700 text-sm">
                        {daysRemaining > 0
                          ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`
                          : 'Suspension has expired'}
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

              {/* Previous Suspensions */}
              {(suspensionStatus?.suspensionCount ?? 0) > 1 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-900 mb-1">Previous Suspensions</h3>
                  <p className="text-yellow-800">
                    This is your {suspensionStatus?.suspensionCount}
                    {suspensionStatus?.suspensionCount === 2 ? 'nd' : suspensionStatus?.suspensionCount === 3 ? 'rd' : 'th'} suspension.
                  </p>
                </div>
              )}

              {/* Appeal Section */}
              {!appealSubmitted && !showAppealForm && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowAppealForm(true)}
                    className="w-full bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#043658] font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Appeal Suspension
                  </button>
                </div>
              )}

              {/* Appeal Form */}
              {showAppealForm && (
                <form onSubmit={handleSubmitAppeal} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={appealForm.subject}
                      onChange={(e) => setAppealForm({ ...appealForm, subject: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
                      placeholder="Brief description of your appeal"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={appealForm.explanation}
                      onChange={(e) => setAppealForm({ ...appealForm, explanation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
                      placeholder="Provide a detailed explanation of why you believe your suspension should be lifted"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 bg-[#FFC107] hover:bg-[#FFC107]/90 text-[#043658] font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Submit Appeal
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAppealForm(false)}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Appeal Submitted */}
              {appealSubmitted && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-2 rounded-full">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Appeal Submitted</h3>
                      <p className="text-green-800 text-sm">
                        Your appeal has been sent to the moderation team for review.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Button */}
              <button
                onClick={handleLogout}
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
