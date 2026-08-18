'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Ban, Clock, RefreshCw } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useTeachers } from '@/hooks/useTeachers';
import { approveTeacherVerification, rejectTeacherVerification } from '@/services/admin';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function PendingTeachersPage() {
  const { data: teachersData, isLoading, error } = useTeachers();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTeacherForVerification, setSelectedTeacherForVerification] = useState<any | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Use real data from API
  const teachers = (teachersData?.data || []) as any[];

  // Filter only PENDING teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher: any) => {
      // Only show PENDING teachers
      if (teacher.verificationStatus !== 'PENDING') {
        return false;
      }

      const matchesSearch =
        !searchQuery ||
        (teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.school?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      return matchesSearch;
    });
  }, [teachers, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const isResubmitted = (teacher: any) => {
    if (!teacher.createdAt || !teacher.updatedAt) return false;
    const createdDate = new Date(teacher.createdAt);
    const updatedDate = new Date(teacher.updatedAt);
    // If updatedAt is more than 1 minute after createdAt, it's likely a resubmission
    const diffMinutes = (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60);
    return diffMinutes > 1;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-[#043658]">Loading pending teachers...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-red-600">Error loading pending teachers</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#043658]">Pending Teacher Verifications</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Review and approve new teacher registrations</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-sm font-semibold text-amber-900">{filteredTeachers.length} Pending</span>
          </div>
        </div>

        {/* Search - Single Row */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, email, or school..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
            />
          </div>
        </div>

        {/* Pending Teachers Table Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
            <p className="text-sm font-semibold text-[#043658]">
              Showing {filteredTeachers.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredTeachers.length)} of {filteredTeachers.length} pending teachers
            </p>
          </div>

          {/* Table Body */}
          {paginatedTeachers.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-sm font-semibold text-[#043658]">No pending verifications</p>
              <p className="text-xs text-[#6B7C93] mt-1">All teacher registrations have been processed</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EEF3] bg-white">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">School & Region</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Registered</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeachers.map((teacher: any) => (
                    <tr key={teacher.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Teacher */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-bold text-amber-700">
                            {getInitials(teacher.firstName, teacher.lastName)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[#043658]">
                                {teacher.firstName} {teacher.lastName}
                              </p>
                              {isResubmitted(teacher) && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                  <RefreshCw className="w-3 h-3" />
                                  Resubmitted
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B7C93]">{teacher.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* School & Region */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#043658]">{teacher.school}</p>
                        <p className="text-xs text-[#6B7C93]">
                          {teacher.woreda}, {teacher.zone}
                        </p>
                        <p className="text-xs text-[#6B7C93]">{teacher.region}</p>
                      </td>

                      {/* Department */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#043658]">{teacher.department || 'N/A'}</p>
                      </td>

                      {/* Registered Date */}
                      <td className="px-6 py-4">
                        <p className="text-xs text-[#6B7C93]">
                          {new Date(teacher.createdAt).toLocaleDateString()}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedTeacherForVerification(teacher);
                            setShowVerificationModal(true);
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all text-sm font-semibold shadow-sm hover:shadow-md"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-[#6B7C93]">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedTeacherForVerification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            {/* Modal Header - Compact */}
            <div className="bg-[#043658] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#FFC107] rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-[#043658]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Teacher Verification</h2>
                  <p className="text-xs text-blue-200">Review credentials and approve</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedTeacherForVerification(null);
                }}
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Teacher Profile Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-[#043658] text-white rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-md">
                    {getInitials(selectedTeacherForVerification.firstName, selectedTeacherForVerification.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#043658] mb-1">
                      {selectedTeacherForVerification.firstName} {selectedTeacherForVerification.lastName}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3 truncate">{selectedTeacherForVerification.email}</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">School</p>
                        <p className="text-xs font-semibold text-[#043658] truncate">{selectedTeacherForVerification.school}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Department</p>
                        <p className="text-xs font-semibold text-[#043658] truncate">{selectedTeacherForVerification.department || 'N/A'}</p>
                      </div>
                      <div className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Location</p>
                        <p className="text-xs font-semibold text-[#043658] truncate">
                          {selectedTeacherForVerification.woreda}, {selectedTeacherForVerification.zone}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Region</p>
                        <p className="text-xs font-semibold text-[#043658] truncate">{selectedTeacherForVerification.region}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Preview Card */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
                <div className="flex items-center space-x-2 mb-4">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h4 className="text-sm font-bold text-[#043658]">Verification Document</h4>
                </div>
                
                <div className="bg-white rounded-xl p-6 text-center border border-amber-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-3">
                    <svg className="w-9 h-9 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-bold text-[#043658] mb-1">Teacher Certificate</p>
                  <p className="text-xs text-slate-600 mb-3">Uploaded during registration</p>
                  <button className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-semibold">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>View Document</span>
                  </button>
                </div>
              </div>

              {/* Quick Review Checklist */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <h4 className="text-xs font-bold text-[#043658] mb-3 uppercase tracking-wide">Review Checklist</h4>
                <div className="space-y-2">
                  {[
                    'Document is clear and readable',
                    'Name matches registration',
                    'Institution details verified',
                    'Document appears authentic'
                  ].map((item, idx) => (
                    <label key={idx} className="flex items-center space-x-2 text-sm text-slate-700 cursor-pointer hover:text-[#043658] transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-[#043658] focus:ring-[#043658]" />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer - Sticky */}
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setIsApproving(true);
                    try {
                      await approveTeacherVerification(selectedTeacherForVerification.id);
                      toast.success('Teacher Approved!', {
                        description: `${selectedTeacherForVerification.firstName} ${selectedTeacherForVerification.lastName} has been verified and can now access the platform`
                      });
                      setShowVerificationModal(false);
                      setSelectedTeacherForVerification(null);
                      window.location.reload();
                    } catch (error: any) {
                      console.error('Failed to approve teacher:', error);
                      const errorMessage = error.response?.data?.message || error.message || 'Failed to approve teacher';
                      toast.error('Approval Failed', {
                        description: errorMessage
                      });
                      setIsApproving(false);
                    }
                  }}
                  disabled={isApproving}
                  className="flex-1 flex items-center justify-center space-x-2 px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
                >
                  {isApproving ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Approving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  disabled={isRejecting}
                  className="flex-1 flex items-center justify-center space-x-2 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none"
                >
                  <Ban className="w-5 h-5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-red-600 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">Reject Teacher Verification</h3>
              <p className="text-red-100 text-sm mt-1">Provide a reason for rejection</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter detailed reason for rejection (minimum 10 characters)..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none transition-all"
                  rows={4}
                  autoFocus
                />
                <p className={`text-xs mt-1 ${rejectionReason.length >= 10 ? 'text-green-600' : 'text-gray-500'}`}>
                  {rejectionReason.length}/10 characters minimum
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (rejectionReason.length < 10) {
                      return;
                    }
                    setIsRejecting(true);
                    try {
                      await rejectTeacherVerification(selectedTeacherForVerification.id, rejectionReason);
                      toast.success('Teacher Rejected', {
                        description: `${selectedTeacherForVerification.firstName} ${selectedTeacherForVerification.lastName} has been notified of the rejection`
                      });
                      setShowRejectModal(false);
                      setShowVerificationModal(false);
                      setSelectedTeacherForVerification(null);
                      setRejectionReason('');
                      window.location.reload();
                    } catch (error: any) {
                      console.error('Failed to reject teacher:', error);
                      const errorMessage = error.response?.data?.message || error.message || 'Failed to reject teacher';
                      toast.error('Rejection Failed', {
                        description: errorMessage
                      });
                      setIsRejecting(false);
                    }
                  }}
                  disabled={rejectionReason.length < 10 || isRejecting}
                  className="flex-1 px-5 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-bold flex items-center justify-center space-x-2"
                >
                  {isRejecting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Rejecting...</span>
                    </>
                  ) : (
                    <span>Confirm Rejection</span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                  }}
                  disabled={isRejecting}
                  className="flex-1 px-5 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 disabled:opacity-50 transition-all font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
