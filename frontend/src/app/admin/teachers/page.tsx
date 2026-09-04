'use client';

import { useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Search, Filter, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Ban, MoreVertical, Eye, Clock, FileText, UserCheck } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useTeachers } from '@/hooks/useTeachers';
import { activateTeacher } from '@/services/admin';
import type { Teacher, TeachersResponse } from '@/types/admin';
import { getErrorMessage } from '@/lib/error-message';
import SuspendTeacherModal from '@/components/admin/SuspendTeacherModal';
import SuspensionHistory, { suspensionHistoryQueryKey } from '@/components/admin/SuspensionHistory';

const ITEMS_PER_PAGE = 10;

export default function AdminTeachersPage() {
  return (
    <Suspense fallback={null}>
      <AdminTeachersPageContent />
    </Suspense>
  );
}

function AdminTeachersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: teachersData, isLoading, error } = useTeachers();
  // Other admin pages (e.g. post moderation "View author") deep-link here with ?search=<email>.
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('approved'); // Show only approved teachers
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  // Snapshot of "now" for the remaining-time labels (day granularity, so a per-mount value is accurate).
  const [renderedAt] = useState(() => Date.now());

  // Use real data from API
  const teachers = useMemo<Teacher[]>(() => teachersData?.data ?? [], [teachersData]);

  // Filter teachers - only show APPROVED by default
  const filteredTeachers = useMemo(() => {
    const filtered = teachers.filter((teacher) => {
      const matchesSearch =
        (teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.school?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      const matchesLevel = selectedLevel === 'all' || teacher.level === selectedLevel;
      const matchesStatus = selectedStatus === 'all' || teacher.status === selectedStatus;
      
      // Filter by verification status
      const matchesVerification =
        selectedVerification === 'all' ||
        (selectedVerification === 'approved' && teacher.verificationStatus === 'APPROVED') ||
        (selectedVerification === 'pending' && teacher.verificationStatus === 'PENDING') ||
        (selectedVerification === 'rejected' && teacher.verificationStatus === 'REJECTED');

      return matchesSearch && matchesLevel && matchesStatus && matchesVerification;
    });
    
    return filtered;
  }, [teachers, searchQuery, selectedLevel, selectedStatus, selectedVerification]);

  // Pagination
  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTeachers = filteredTeachers.slice(startIndex, endIndex);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      LEVEL_1: 'bg-blue-100 text-blue-700',
      LEVEL_2: 'bg-purple-100 text-purple-700',
      LEVEL_3: 'bg-amber-100 text-amber-700',
      LEVEL_4: 'bg-green-100 text-green-700',
      LEVEL_5: 'bg-red-100 text-red-700',
    };
    return colors[level] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE') return <span className="h-2 w-2 rounded-full bg-green-500" />;
    if (status === 'SUSPENDED' || status === 'PERMANENTLY_SUSPENDED') return <span className="h-2 w-2 rounded-full bg-red-500" />;
    return <span className="h-2 w-2 rounded-full bg-gray-500" />;
  };

  // Display-only: the backend is the source of truth and has already expired
  // any finished temporary suspension before returning this list.
  const getSuspensionInfo = (teacher: Teacher) => {
    if (teacher.status !== 'SUSPENDED' && teacher.status !== 'PERMANENTLY_SUSPENDED') return null;

    const isPermanent = teacher.status === 'PERMANENTLY_SUSPENDED';
    const suspensionUntil = teacher.suspensionUntil ? new Date(teacher.suspensionUntil) : null;
    const remainingMs = suspensionUntil ? suspensionUntil.getTime() - renderedAt : null;

    let remainingLabel: string | null = null;
    if (!isPermanent) {
      if (remainingMs === null) {
        remainingLabel = 'Until lifted by an admin';
      } else if (remainingMs <= 0) {
        remainingLabel = 'Expiring…';
      } else {
        const hours = Math.ceil(remainingMs / (1000 * 60 * 60));
        remainingLabel =
          hours < 24
            ? `${hours} hour${hours !== 1 ? 's' : ''} left`
            : `${Math.ceil(hours / 24)} day${Math.ceil(hours / 24) !== 1 ? 's' : ''} left`;
      }
    }

    return {
      isPermanent,
      remainingLabel,
      reason: teacher.suspensionReason ?? null,
    };
  };

  const getVerificationBadge = (teacher: Teacher) => {
    if (teacher.verificationStatus === 'APPROVED') {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </div>
      );
    }
    
    if (teacher.verificationStatus === 'REJECTED') {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-red-700">
          <Ban className="h-3.5 w-3.5" />
          Rejected
        </div>
      );
    }
    
    if (teacher.verificationStatus === 'PENDING') {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertCircle className="h-3.5 w-3.5" />
          Pending
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
        <AlertCircle className="h-3.5 w-3.5" />
        Unknown
      </div>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-[#043658]">Loading teachers...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-red-600">Error loading teachers</p>
        </div>
      </AdminLayout>
    );
  }

  /** Patch the cached row so the table updates instantly, then refetch for truth. */
  const applyTeacherUpdate = (updated: Teacher) => {
    queryClient.setQueriesData<TeachersResponse | undefined>({ queryKey: ['teachers'] }, (old) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: old.data.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)),
      };
    });
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
    queryClient.invalidateQueries({ queryKey: suspensionHistoryQueryKey(updated.id) });
  };

  const handleUnsuspend = async (teacher: Teacher) => {
    if (actionLoading) return;
    try {
      setActionLoading(teacher.id);
      const updated = await activateTeacher(teacher.id);
      applyTeacherUpdate(updated);
      toast.success('Teacher unsuspended successfully.', {
        description: `${teacher.firstName} ${teacher.lastName} can access ServeLink again.`,
      });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to unsuspend teacher'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#043658]">Approved Teachers</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Manage and support verified educators on the platform</p>
          </div>
        </div>

        {/* Filters Card - Single Row */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  type="text"
                  placeholder="Name, Email, or School"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <select
                value={selectedLevel}
                onChange={(e) => {
                  setSelectedLevel(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
              >
                <option value="all">All Levels</option>
                <option value="LEVEL_1">Level 1</option>
                <option value="LEVEL_2">Level 2</option>
                <option value="LEVEL_3">Level 3</option>
                <option value="LEVEL_4">Level 4</option>
                <option value="LEVEL_5">Level 5</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
              >
                <option value="all">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PERMANENTLY_SUSPENDED">Permanently Suspended</option>
              </select>
            </div>

            {/* Verification Filter */}
            <div>
              <select
                value={selectedVerification}
                onChange={(e) => {
                  setSelectedVerification(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
              >
                <option value="all">All Verification</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Teachers Table Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
            <p className="text-sm font-semibold text-[#043658]">
              Showing {filteredTeachers.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredTeachers.length)} of {filteredTeachers.length} teachers
            </p>
          </div>

          {/* Table Body */}
          {paginatedTeachers.length === 0 ? (
            <div className="p-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
              <p className="text-sm font-semibold text-[#043658]">No teachers found</p>
              <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EEF3] bg-white">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">School & Region</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Verification</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTeachers.map((teacher) => (
                    <tr key={teacher.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Teacher */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658]/10 font-bold text-[#043658]">
                            {getInitials(teacher.firstName, teacher.lastName)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#043658]">
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className="text-xs text-[#6B7C93]">{teacher.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* School & Region */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-[#043658]">{teacher.school}</p>
                          <p className="text-xs text-[#6B7C93]">{teacher.region}</p>
                        </div>
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getLevelColor(teacher.level)}`}>
                          {teacher.level?.replace('_', ' ') || 'N/A'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(teacher.status)}
                            <span className={`text-sm font-medium ${
                              teacher.status === 'ACTIVE' ? 'text-green-700' : 
                              teacher.status === 'SUSPENDED' ? 'text-orange-700' :
                              teacher.status === 'PERMANENTLY_SUSPENDED' ? 'text-red-700' :
                              'text-gray-700'
                            }`}>
                              {teacher.status === 'PERMANENTLY_SUSPENDED' ? 'Perm. Suspended' : teacher.status}
                            </span>
                          </div>
                          {(() => {
                            const suspensionInfo = getSuspensionInfo(teacher);
                            if (!suspensionInfo) return null;
                            return (
                              <div className="text-xs text-gray-500" title={suspensionInfo.reason ?? undefined}>
                                {suspensionInfo.isPermanent ? (
                                  <span>Permanent</span>
                                ) : (
                                  <span>{suspensionInfo.remainingLabel}</span>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Verification */}
                      <td className="px-6 py-4">{getVerificationBadge(teacher)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setActionMenuOpen(actionMenuOpen === teacher.id ? null : teacher.id)}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>

                          {actionMenuOpen === teacher.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  setSelectedTeacher(teacher);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Teacher
                              </button>
                              
                              {teacher.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => {
                                    setActionMenuOpen(null);
                                    setSelectedTeacher(teacher);
                                    setSuspendModalOpen(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
                                >
                                  <Ban className="h-4 w-4" />
                                  Suspend Teacher
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActionMenuOpen(null);
                                    handleUnsuspend(teacher);
                                  }}
                                  disabled={actionLoading === teacher.id}
                                  className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2 disabled:opacity-50"
                                >
                                  <UserCheck className="h-4 w-4" />
                                  {actionLoading === teacher.id ? 'Unsuspending...' : 'Unsuspend'}
                                </button>
                              )}
                              {/* History and appeals persist after unsuspension, so they are available for every teacher. */}
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  setSelectedTeacher(teacher);
                                  setHistoryModalOpen(true);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Clock className="h-4 w-4" />
                                Suspension History
                              </button>
                              <button
                                onClick={() => {
                                  setActionMenuOpen(null);
                                  router.push(`/admin/appeals?teacherId=${encodeURIComponent(teacher.id)}`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <FileText className="h-4 w-4" />
                                View Appeals
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-[#E8EEF3] bg-[#F8FAFC] px-6 py-4 flex items-center justify-between">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 rounded text-sm font-semibold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#043658] text-white'
                          : 'text-[#043658] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="text-sm text-[#6B7C93]">...</span>}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Suspend Teacher Modal */}
      {selectedTeacher && (
        <SuspendTeacherModal
          isOpen={suspendModalOpen}
          onClose={() => {
            setSuspendModalOpen(false);
            setSelectedTeacher(null);
          }}
          teacherId={selectedTeacher.id}
          teacherName={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
          onSuccess={(updated, suspensionType) => {
            applyTeacherUpdate(updated);
            const name = `${selectedTeacher.firstName} ${selectedTeacher.lastName}`;
            if (suspensionType === 'WARNING') {
              toast.success('Warning sent.', { description: `${name} has been notified.` });
            } else {
              toast.success('Teacher suspended successfully.', {
                description:
                  suspensionType === 'PERMANENT'
                    ? `${name} has been permanently suspended.`
                    : `${name} has lost access until ${
                        updated.suspensionUntil
                          ? new Date(updated.suspensionUntil).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'lifted by an admin'
                      }.`,
              });
            }
          }}
        />
      )}

      {/* Suspension History Modal */}
      {selectedTeacher && (
        <SuspensionHistory
          teacherId={selectedTeacher.id}
          teacherName={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedTeacher(null);
          }}
        />
      )}
    </AdminLayout>
  );
}
