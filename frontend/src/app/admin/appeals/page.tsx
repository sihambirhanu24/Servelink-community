'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, Eye, Check, X, Clock, AlertTriangle } from 'lucide-react';
import axios from 'axios';

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
    suspensionReason: string | null;
    suspensionStart: string | null;
    suspensionUntil: string | null;
  };
}

export default function AppealsPage() {
  return (
    <Suspense fallback={null}>
      <AppealsPageContent />
    </Suspense>
  );
}

function AppealsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // /admin/teachers "View Appeals" deep-links here with ?teacherId=<id>.
  const teacherIdFilter = searchParams.get('teacherId');
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [filteredAppeals, setFilteredAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAppeal, setSelectedAppeal] = useState<Appeal | null>(null);

  useEffect(() => {
    fetchAppeals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherIdFilter]);

  useEffect(() => {
    filterAppeals();
  }, [appeals, statusFilter, searchQuery]);

  const fetchAppeals = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/admin/suspension/appeals`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
          ...(teacherIdFilter ? { teacherId: teacherIdFilter } : {}),
        },
      });

      setAppeals(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load appeals');
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      APPROVED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
    };

    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      APPROVED: <Check className="w-4 h-4" />,
      REJECTED: <X className="w-4 h-4" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading appeals...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Suspension Appeals</h1>
          <p className="text-gray-600 mt-1">Review and manage teacher suspension appeals</p>
          {teacherIdFilter && (
            <button
              type="button"
              onClick={() => router.push('/admin/appeals')}
              className="mt-2 inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Showing one teacher&apos;s appeals
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by teacher name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appeals Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredAppeals.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appeals found</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your filters or search query'
                : 'There are no suspension appeals to review'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suspension Until
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppeals.map((appeal) => (
                  <tr key={appeal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {appeal.teacher.firstName} {appeal.teacher.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{appeal.teacher.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {appeal.subject}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(appeal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(appeal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(appeal.teacher.suspensionUntil)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedAppeal(appeal)}
                        className="inline-flex items-center gap-1.5 text-[#043658] hover:text-[#FFC107] font-medium text-sm"
                      >
                        <Eye className="w-4 h-4" />
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

      {/* Appeal Review Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Appeal Review</h2>
                <button
                  onClick={() => setSelectedAppeal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Teacher Information */}
              <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Teacher Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium">
                      {selectedAppeal.teacher.firstName} {selectedAppeal.teacher.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{selectedAppeal.teacher.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Level:</span>
                    <span className="ml-2 font-medium">{selectedAppeal.teacher.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className="ml-2 font-medium">{selectedAppeal.teacher.status}</span>
                  </div>
                </div>
              </div>

              {/* Suspension Information */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-3">Suspension Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-red-700">Reason:</span>
                    <span className="ml-2 font-medium text-red-900">
                      {selectedAppeal.teacher.suspensionReason || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700">Suspended On:</span>
                    <span className="ml-2 font-medium text-red-900">
                      {formatDate(selectedAppeal.teacher.suspensionStart)}
                    </span>
                  </div>
                  <div>
                    <span className="text-red-700">Suspension Until:</span>
                    <span className="ml-2 font-medium text-red-900">
                      {formatDate(selectedAppeal.teacher.suspensionUntil)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Appeal Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Appeal Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-blue-700">Subject:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedAppeal.subject}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Explanation:</span>
                    <p className="mt-2 text-blue-900">{selectedAppeal.explanation}</p>
                  </div>
                  <div>
                    <span className="text-blue-700">Submitted On:</span>
                    <span className="ml-2 font-medium text-blue-900">
                      {formatDate(selectedAppeal.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Response (if already reviewed) */}
              {selectedAppeal.status !== 'PENDING' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Admin Response</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      {getStatusBadge(selectedAppeal.status)}
                    </div>
                    {selectedAppeal.adminResponse && (
                      <div>
                        <span className="text-gray-500">Response:</span>
                        <p className="mt-2 text-gray-900">{selectedAppeal.adminResponse}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Reviewed On:</span>
                      <span className="ml-2 font-medium">{formatDate(selectedAppeal.reviewedAt)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions for pending appeals */}
              {selectedAppeal.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('admin_token');
                        await axios.post(
                          `${API_URL}/admin/suspension/appeals/${selectedAppeal.id}/review`,
                          { status: 'APPROVED', adminResponse: 'Appeal approved' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        fetchAppeals();
                        setSelectedAppeal(null);
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to approve appeal');
                      }
                    }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Approve Appeal
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('admin_token');
                        await axios.post(
                          `${API_URL}/admin/suspension/appeals/${selectedAppeal.id}/review`,
                          { status: 'REJECTED', adminResponse: 'Appeal rejected' },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        fetchAppeals();
                        setSelectedAppeal(null);
                      } catch (err: any) {
                        setError(err.response?.data?.message || 'Failed to reject appeal');
                      }
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Reject Appeal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
