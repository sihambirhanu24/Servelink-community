'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Ban, Clock, RefreshCw, FileText, Download, Eye } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useTeachers } from '@/hooks/useTeachers';
import { approveTeacherVerification, rejectTeacherVerification } from '@/services/admin';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/axios';

const ITEMS_PER_PAGE = 10;

// Document type labels
const DOC_TYPE_LABELS: Record<string, string> = {
  NATIONAL_ID: 'National ID',
  TEACHER_ID: 'Teacher Certificate / ID',
  DEGREE_CERTIFICATE: 'Degree Certificate',
};

// Document type icons/colors
const DOC_TYPE_CONFIG: Record<string, { bg: string; text: string; icon: string }> = {
  NATIONAL_ID: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '🪪' },
  TEACHER_ID: { bg: 'bg-green-50', text: 'text-green-700', icon: '📜' },
  DEGREE_CERTIFICATE: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🎓' },
};

// Component to fetch and display verification documents
function VerificationDocumentsList({ teacherId }: { teacherId: string }) {
  const { data: verificationInfo, isLoading } = useQuery({
    queryKey: ['teacher-verification', teacherId],
    queryFn: async () => {
      const { data } = await adminApi.get(`/admin/teachers/${teacherId}/verification`);
      return data;
    },
  });

  const documents = verificationInfo?.documents || [];

  async function viewDocument(documentId: string) {
    const token = localStorage.getItem('admin_token') || '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    try {
      const docUrl = `${baseUrl}/admin/teachers/${teacherId}/documents/${documentId}`;
      const docRes = await fetch(docUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!docRes.ok) throw new Error('Failed to fetch document file');
      
      const blob = await docRes.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error("Failed to view document", err);
      toast.error('Failed to load document');
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-amber-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-5 border-2 border-red-200">
        <div className="flex items-center space-x-2 mb-3">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h4 className="text-sm font-bold text-red-700">No Documents Uploaded</h4>
        </div>
        <p className="text-xs text-red-600">This teacher has not uploaded any verification documents yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-200">
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h4 className="text-sm font-bold text-[#043658]">Verification Documents</h4>
        <span className="ml-auto text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
          {documents.length} {documents.length === 1 ? 'document' : 'documents'}
        </span>
      </div>
      
      <div className="space-y-3">
        {documents.map((doc: any) => {
          const config = DOC_TYPE_CONFIG[doc.fileType] || { bg: 'bg-slate-50', text: 'text-slate-700', icon: '📄' };
          const label = DOC_TYPE_LABELS[doc.fileType] || doc.fileType;
          
          return (
            <div
              key={doc.id}
              className="bg-white rounded-xl p-4 border border-amber-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.bg} text-2xl`}>
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold ${config.text} mb-1`}>{label}</p>
                      <p className="text-xs text-slate-600 truncate mb-1">{doc.fileName}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => viewDocument(doc.id)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs font-semibold shadow-sm hover:shadow-md shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg bg-white/70 border border-amber-300 p-3">
        <p className="text-xs text-slate-600 leading-relaxed flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Click "View" to open and review each document in a new tab. Verify that all information matches the teacher's profile.</span>
        </p>
      </div>
    </div>
  );
}

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
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Compact */}
            <div className="bg-gradient-to-r from-[#043658] to-[#065a91] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#FFC107] rounded-xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="w-6 h-6 text-[#043658]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Teacher Verification</h2>
                  <p className="text-xs text-blue-200">Review complete profile and credentials</p>
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
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Teacher Profile Card */}
              <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-2xl p-5 border border-slate-200">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-[#043658] text-white rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md">
                    {getInitials(selectedTeacherForVerification.firstName, selectedTeacherForVerification.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[#043658] mb-1">
                      {selectedTeacherForVerification.firstName} {selectedTeacherForVerification.lastName}
                    </h3>
                    <p className="text-sm text-slate-600 mb-2 truncate flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {selectedTeacherForVerification.email}
                    </p>
                    {selectedTeacherForVerification.phone && (
                      <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {selectedTeacherForVerification.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              {(selectedTeacherForVerification.gender || selectedTeacherForVerification.dateOfBirth || selectedTeacherForVerification.bio) && (
                <div className="bg-white rounded-2xl p-5 border border-slate-200">
                  <h4 className="text-sm font-bold text-[#043658] mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTeacherForVerification.gender && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Gender</p>
                        <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.gender}</p>
                      </div>
                    )}
                    {selectedTeacherForVerification.dateOfBirth && (
                      <div className="bg-slate-50 rounded-lg px-3 py-2">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Date of Birth</p>
                        <p className="text-sm font-semibold text-[#043658]">
                          {new Date(selectedTeacherForVerification.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedTeacherForVerification.bio && (
                    <div className="mt-3 bg-slate-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Bio</p>
                      <p className="text-sm text-slate-700">{selectedTeacherForVerification.bio}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Professional Information */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <h4 className="text-sm font-bold text-[#043658] mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Professional Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTeacherForVerification.profession && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Profession</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.profession}</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.teacherIdNumber && (
                    <div className="bg-indigo-50 rounded-lg px-3 py-2 border-2 border-indigo-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Teacher ID Number</p>
                      <p className="text-sm font-semibold text-indigo-700">{selectedTeacherForVerification.teacherIdNumber}</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.specialization && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Specialization</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.specialization}</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.gradeLevel && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Grade Level</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.gradeLevel}</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.yearsOfExperience !== null && selectedTeacherForVerification.yearsOfExperience !== undefined && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Experience</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.yearsOfExperience} years</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.subject && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Subject</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.subject}</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.department && (
                    <div className="bg-blue-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Department</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.department}</p>
                    </div>
                  )}
                </div>
                {selectedTeacherForVerification.skills && (
                  <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Skills</p>
                    <p className="text-sm text-slate-700">{selectedTeacherForVerification.skills}</p>
                  </div>
                )}
              </div>

              {/* School Information */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200">
                <h4 className="text-sm font-bold text-[#043658] mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  School & Location Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-lg px-3 py-2 col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">School Name</p>
                    <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.school}</p>
                  </div>
                  {selectedTeacherForVerification.schoolType && (
                    <div className="bg-green-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">School Type</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.schoolType}</p>
                    </div>
                  )}
                  {selectedTeacherForVerification.city && (
                    <div className="bg-green-50 rounded-lg px-3 py-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">City</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.city}</p>
                    </div>
                  )}
                  <div className="bg-green-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Woreda</p>
                    <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.woreda}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Zone</p>
                    <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.zone}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg px-3 py-2 col-span-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">Region</p>
                    <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.region}</p>
                  </div>
                  {selectedTeacherForVerification.schoolLocation && (
                    <div className="bg-green-50 rounded-lg px-3 py-2 col-span-2">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-0.5">School Location Details</p>
                      <p className="text-sm font-semibold text-[#043658]">{selectedTeacherForVerification.schoolLocation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Documents List */}
              <VerificationDocumentsList teacherId={selectedTeacherForVerification.id} />

              {/* Registration Date */}
              <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
                <p className="text-xs text-slate-500 font-semibold mb-1">Registration Date</p>
                <p className="text-sm text-[#043658] font-medium">
                  {new Date(selectedTeacherForVerification.createdAt).toLocaleString()}
                </p>
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
