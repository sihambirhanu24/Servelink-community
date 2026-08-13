'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, MoreVertical, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useTeachers } from '@/hooks/useTeachers';
import { suspendTeacher, activateTeacher } from '@/services/admin';

const ITEMS_PER_PAGE = 10;

export default function AdminTeachersPage() {
  const { data: teachersData, isLoading, error, refetch } = useTeachers();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVerification, setSelectedVerification] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Use real data from API
  const teachers = (teachersData?.data || []) as any[];

  // Filter teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((teacher: any) => {
      const matchesSearch =
        (teacher.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (teacher.school?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      const matchesLevel = selectedLevel === 'all' || teacher.level === selectedLevel;
      const matchesStatus = selectedStatus === 'all' || teacher.status === selectedStatus;
      const matchesVerification =
        selectedVerification === 'all' ||
        (selectedVerification === 'verified' && teacher.verified) ||
        (selectedVerification === 'pending' && !teacher.verified);

      return matchesSearch && matchesLevel && matchesStatus && matchesVerification;
    });
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
    return <span className="h-2 w-2 rounded-full bg-red-500" />;
  };

  const getVerificationBadge = (verified: boolean) => {
    if (verified) {
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Verified
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 text-xs font-medium text-amber-700">
        <AlertCircle className="h-3.5 w-3.5" />
        Pending
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

  const handleToggleStatus = async (teacherId: string, currentStatus: string) => {
    try {
      setActionLoading(teacherId);
      if (currentStatus === 'ACTIVE') {
        await suspendTeacher(teacherId);
      } else {
        await activateTeacher(teacherId);
      }
      refetch();
    } catch (err) {
      console.error('Error updating teacher status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Teacher Management</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Manage, verify, and support educators on the platform.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
            <Plus className="h-4 w-4" />
            Add New Teacher
          </button>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-semibold text-[#043658] mb-2 block">Search Teachers</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
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

            {/* Filter Row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Level */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Level</label>
                <select
                  value={selectedLevel}
                  onChange={(e) => {
                    setSelectedLevel(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Levels</option>
                  <option value="LEVEL_1">Level 1</option>
                  <option value="LEVEL_2">Level 2</option>
                  <option value="LEVEL_3">Level 3</option>
                  <option value="LEVEL_4">Level 4</option>
                  <option value="LEVEL_5">Level 5</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>

              {/* Verification */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Verification</label>
                <select
                  value={selectedVerification}
                  onChange={(e) => {
                    setSelectedVerification(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Verification</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
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
                  {paginatedTeachers.map((teacher: any) => (
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
                        <div className="flex items-center gap-2">
                          {getStatusIcon(teacher.status)}
                          <span className={`text-sm font-medium ${teacher.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'}`}>
                            {teacher.status}
                          </span>
                        </div>
                      </td>

                      {/* Verification */}
                      <td className="px-6 py-4">{getVerificationBadge(teacher.verified)}</td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleStatus(teacher.id, teacher.status)}
                          disabled={actionLoading === teacher.id}
                          className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
                            teacher.status === 'ACTIVE'
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={teacher.status === 'ACTIVE' ? 'Suspend teacher' : 'Activate teacher'}
                        >
                          {teacher.status === 'ACTIVE' ? (
                            <Ban className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
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
    </AdminLayout>
  );
}
