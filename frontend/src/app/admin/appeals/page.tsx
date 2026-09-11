'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  Eye, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  RefreshCw, 
  FileText,
  User,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/layout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Appeal {
  id: string;
  subject: string;
  explanation: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt: string | null;
  adminResponse: string | null;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level: string;
    status: string;
    school?: string;
    woreda?: string;
    zone?: string;
    region?: string;
    suspensionReason: string | null;
    suspensionStart: string | null;
    suspensionUntil: string | null;
  };
}

interface AppealStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AppealsPage() {
  return (
    <Suspense fallback={<AdminLayout><div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-[#043658]" /></div></AdminLayout>}>
      <AppealsPageContent />
    </Suspense>
  );
}

function AppealsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teacherIdFilter = searchParams.get('teacherId');
  
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [filteredAppeals, setFilteredAppeals] = useState<Appeal[]>([]);
  const [stats, setStats] = useState<AppealStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    fetchAppeals();
  }, [teacherIdFilter]);

  useEffect(() => {
    filterAppeals();
    calculateStats();
  }, [appeals, statusFilter, searchQuery]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const params = new URLSearchParams();
      if (teacherIdFilter) params.append('teacherId', teacherIdFilter);

      const response = await fetch(`${API_URL}/admin/suspension/appeals?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load appeals');
      }

      const data = await response.json();
      setAppeals(data);
    } catch (err: any) {
      console.error('Failed to fetch appeals:', err);
      setError(err.message || 'Failed to load appeals');
      toast.error('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const pending = appeals.filter((a) => a.status === 'PENDING').length;
    const approved = appeals.filter((a) => a.status === 'APPROVED').length;
    const rejected = appeals.filter((a) => a.status === 'REJECTED').length;
    setStats({ total: appeals.length, pending, approved, rejected });
  };

  const filterAppeals = () => {
    let filtered = appeals;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((appeal) => appeal.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (appeal) =>
          appeal.teacher.firstName.toLowerCase().includes(query) ||
          appeal.teacher.lastName.toLowerCase().includes(query) ||
          appeal.teacher.email.toLowerCase().includes(query)
      );
    }

    setFilteredAppeals(filtered);
  };

  const handleApprove = async () => {
    if (!selectedAppeal) return;

    try {
      setIsApproving(true);
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`${API_URL}/admin/suspension/appeals/${selectedAppeal.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'APPROVED', 
          adminResponse: 'Appeal approved. Suspension has been lifted.' 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve appeal');
      }

      toast.success('Appeal approved successfully');
      await fetchAppeals();
      setSelectedAppeal(null);
    } catch (err: any) {
      console.error('Failed to approve appeal:', err);
      toast.error(err.message || 'Failed to approve appeal');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAppeal || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setIsRejecting(true);
      const token = localStorage.getItem('admin_token');

      const response = await fetch(`${API_URL}/admin/suspension/appeals/${selectedAppeal.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 'REJECTED', 
          adminResponse: rejectionReason 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject appeal');
      }

      toast.success('Appeal rejected');
      await fetchAppeals();
      setSelectedAppeal(null);
      setShowRejectionModal(false);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Failed to reject appeal:', err);
      toast.error(err.message || 'Failed to reject appeal');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      PENDING: <Clock className="w-3.5 h-3.5" />,
      APPROVED: <Check className="w-3.5 h-3.5" />,
      REJECTED: <X className="w-3.5 h-3.5" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}
      >
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (error && !appeals.length) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertTriangle className="h-12 w-12 text-red-600" />
          <p className="text-lg font-semibold text-[#043658]">{error}</p>
          <button
            onClick={fetchAppeals}
            className="flex items-center gap-2 rounded-lg bg-[#043658] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#043658]">Suspension Appeals</h1>
          <p className="mt-1 text-sm text-[#6B7C93]">Review and manage teacher suspension appeals</p>
          {teacherIdFilter && (
            <button
              type="button"
              onClick={() => router.push('/admin/appeals')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#D9E2EC] bg-white px-3 py-1.5 text-xs font-medium text-[#043658] hover:bg-[#F8FAFC]"
            >
              Showing one teacher&apos;s appeals
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7C93]">Total Appeals</p>
                <p className="mt-1 text-2xl font-bold text-[#043658]">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10">
                <FileText className="h-5 w-5 text-[#043658]" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7C93]">Pending</p>
                <p className="mt-1 text-2xl font-bold text-yellow-700">{stats.pending}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Clock className="h-5 w-5 text-yellow-700" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7C93]">Approved</p>
                <p className="mt-1 text-2xl font-bold text-green-700">{stats.approved}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Check className="h-5 w-5 text-green-700" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B7C93]">Rejected</p>
                <p className="mt-1 text-2xl font-bold text-red-700">{stats.rejected}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                <X className="h-5 w-5 text-red-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6B7C93]" />
              <input
                type="text"
                placeholder="Search by teacher name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white py-2.5 pl-10 pr-4 text-sm text-[#043658] placeholder:text-[#6B7C93] focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-medium text-[#043658] focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Appeals Table */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
            </div>
          ) : filteredAppeals.length === 0 ? (
            <div className="p-12 text-center">
              <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-[#6B7C93]" />
              <h3 className="mb-2 text-lg font-semibold text-[#043658]">No appeals found</h3>
              <p className="text-sm text-[#6B7C93]">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your filters or search query'
                  : 'There are no suspension appeals to review'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#E8EEF3] bg-[#F8FAFC]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7C93]">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7C93]">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7C93]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7C93]">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7C93]">
                      Suspension Until
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6B7C93]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EEF3]">
                  {filteredAppeals.map((appeal) => (
                    <tr key={appeal.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                            {getInitials(appeal.teacher.firstName, appeal.teacher.lastName)}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-[#043658]">
                              {appeal.teacher.firstName} {appeal.teacher.lastName}
                            </div>
                            <div className="text-xs text-[#6B7C93]">{appeal.teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-[#043658]">
                          {appeal.subject}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(appeal.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7C93]">
                        {formatDate(appeal.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B7C93]">
                        {formatDate(appeal.teacher.suspensionUntil)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedAppeal(appeal)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#043658] px-3 py-1.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Appeal Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#D9E2EC] bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E8EEF3] bg-white px-6 py-4">
              <h2 className="text-xl font-bold text-[#043658]">Appeal Review</h2>
              <button
                onClick={() => setSelectedAppeal(null)}
                className="rounded-lg p-1 text-[#6B7C93] hover:bg-[#F8FAFC]"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Teacher Information */}
              <div className="rounded-lg border border-[#E8EEF3] bg-[#F8FAFC] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-[#043658]" />
                  <h3 className="font-semibold text-[#043658]">Teacher Information</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="text-xs text-[#6B7C93]">Name</span>
                    <p className="text-sm font-semibold text-[#043658]">
                      {selectedAppeal.teacher.firstName} {selectedAppeal.teacher.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7C93]">Email</span>
                    <p className="text-sm font-semibold text-[#043658]">{selectedAppeal.teacher.email}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7C93]">Level</span>
                    <p className="text-sm font-semibold text-[#043658]">{selectedAppeal.teacher.level}</p>
                  </div>
                  <div>
                    <span className="text-xs text-[#6B7C93]">Account Status</span>
                    <p className="text-sm font-semibold text-[#043658]">{selectedAppeal.teacher.status}</p>
                  </div>
                  {selectedAppeal.teacher.school && (
                    <>
                      <div>
                        <span className="text-xs text-[#6B7C93]">School</span>
                        <p className="text-sm font-semibold text-[#043658]">{selectedAppeal.teacher.school}</p>
                      </div>
                      <div>
                        <span className="text-xs text-[#6B7C93]">Location</span>
                        <p className="text-sm font-semibold text-[#043658]">
                          {[selectedAppeal.teacher.woreda, selectedAppeal.teacher.zone, selectedAppeal.teacher.region]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Suspension Information */}
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-700" />
                  <h3 className="font-semibold text-red-900">Suspension Details</h3>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-red-700">Reason</span>
                    <p className="text-sm font-semibold text-red-900">
                      {selectedAppeal.teacher.suspensionReason || 'N/A'}
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-xs text-red-700">Suspended On</span>
                      <p className="text-sm font-semibold text-red-900">
                        {formatDate(selectedAppeal.teacher.suspensionStart)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-red-700">Suspension Until</span>
                      <p className="text-sm font-semibold text-red-900">
                        {formatDate(selectedAppeal.teacher.suspensionUntil)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appeal Details */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-700" />
                  <h3 className="font-semibold text-blue-900">Appeal Details</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-blue-700">Subject</span>
                    <p className="text-sm font-semibold text-blue-900">{selectedAppeal.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-700">Explanation</span>
                    <p className="mt-1 text-sm text-blue-900 whitespace-pre-wrap">{selectedAppeal.explanation}</p>
                  </div>
                  <div>
                    <span className="text-xs text-blue-700">Submitted On</span>
                    <p className="text-sm font-semibold text-blue-900">
                      {formatDate(selectedAppeal.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Response (if already reviewed) */}
              {selectedAppeal.status !== 'PENDING' && (
                <div className="rounded-lg border border-[#E8EEF3] bg-[#F8FAFC] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#043658]" />
                    <h3 className="font-semibold text-[#043658]">Admin Response</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-[#6B7C93]">Status</span>
                      <div className="mt-1">{getStatusBadge(selectedAppeal.status)}</div>
                    </div>
                    {selectedAppeal.adminResponse && (
                      <div>
                        <span className="text-xs text-[#6B7C93]">Response</span>
                        <p className="mt-1 text-sm text-[#043658]">{selectedAppeal.adminResponse}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-[#6B7C93]">Reviewed On</span>
                      <p className="text-sm font-semibold text-[#043658]">
                        {formatDate(selectedAppeal.reviewedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions for pending appeals */}
              {selectedAppeal.status === 'PENDING' && (
                <div className="flex gap-3 border-t border-[#E8EEF3] pt-6">
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-600 py-3 px-6 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Approve Appeal
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(true)}
                    disabled={isRejecting}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-3 px-6 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Reject Appeal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectionModal && selectedAppeal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#D9E2EC] bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E8EEF3] px-6 py-4">
              <h3 className="text-lg font-bold text-[#043658]">Reject Appeal</h3>
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setRejectionReason('');
                }}
                className="rounded-lg p-1 text-[#6B7C93] hover:bg-[#F8FAFC]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#6B7C93]">
                Please provide a reason for rejecting this appeal. This will be visible to the teacher.
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm text-[#043658] placeholder:text-[#6B7C93] focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/20 resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReason('');
                  }}
                  className="flex-1 rounded-lg border border-[#D9E2EC] bg-white py-2.5 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !rejectionReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isRejecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Confirm Rejection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
