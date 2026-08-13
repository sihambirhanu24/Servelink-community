'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, AlertTriangle, X, Eye, AlertCircle, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useAdminReports } from '@/hooks/useAdminReports';

interface ReviewReportProps {
  report: any;
  onClose: () => void;
  onResolve?: () => void;
}

function ReviewReportModal({ report, onClose, onResolve }: ReviewReportProps) {
  const [warnLoading, setWarnLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const handleWarn = async () => {
    try {
      setWarnLoading(true);
      // Call warn API
      onResolve?.();
      onClose();
    } finally {
      setWarnLoading(false);
    }
  };

  const handleRemoveContent = async () => {
    try {
      setRemoveLoading(true);
      // Call remove content API
      onResolve?.();
      onClose();
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 border-b border-[#E8EEF3] bg-white px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#6B7C93]">REPORT {report.id}</p>
            <h2 className="text-lg font-bold text-[#043658] mt-1">Review Report</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-[#F8FAFC] transition-colors"
          >
            <X className="h-5 w-5 text-[#6B7C93]" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type Badge */}
          <div>
            <span className={`inline-block rounded-full px-4 py-2 text-sm font-bold ${
              report.type === 'ABUSE' ? 'bg-red-100 text-red-700' :
              report.type === 'SPAM' ? 'bg-blue-100 text-blue-700' :
              report.type === 'HARASSMENT' ? 'bg-orange-100 text-orange-700' :
              'bg-purple-100 text-purple-700'
            }`}>
              {report.type}
            </span>
          </div>

          {/* Reported Content */}
          <div className="bg-[#F8FAFC] rounded-lg p-4 border border-[#E8EEF3]">
            <p className="text-xs font-semibold text-[#6B7C93] mb-2">REPORTED CONTENT</p>
            <div className="border-l-4 border-[#043658] pl-4">
              <p className="text-sm italic text-[#043658]">"{report.content || report.post?.content || 'N/A'}"</p>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <div>
                <p className="text-[#6B7C93] font-medium">{report.post?.author?.firstName} {report.post?.author?.lastName}</p>
                <p className="text-[#6B7C93]">@{report.post?.author?.email?.split('@')[0]}</p>
              </div>
              <p className="text-[#6B7C93]">Posted in {report.post?.community?.name}</p>
            </div>
          </div>

          {/* Report Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reported By */}
            <div>
              <p className="text-xs font-semibold text-[#6B7C93] mb-2 uppercase tracking-wide">Reported By</p>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#043658]/10 text-xs font-bold text-[#043658]">
                  {report.reporter?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#043658]">{report.reporter?.firstName} {report.reporter?.lastName}</p>
                  <p className="text-xs text-[#6B7C93]">@{report.reporter?.email?.split('@')[0]}</p>
                </div>
              </div>
            </div>

            {/* Report Date */}
            <div>
              <p className="text-xs font-semibold text-[#6B7C93] mb-2 uppercase tracking-wide">Reported</p>
              <p className="text-sm font-medium text-[#043658]">{new Date(report.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <p className="text-xs font-semibold text-[#6B7C93] mb-2 uppercase tracking-wide">Reason for Report</p>
            <p className="text-sm text-[#043658]">{report.reason || 'N/A'}</p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="border-t border-[#E8EEF3] bg-[#F8FAFC] px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#D9E2EC] px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleWarn}
            disabled={warnLoading}
            className="flex items-center gap-2 rounded-lg border border-[#FFC107] bg-[#FFC107]/10 px-4 py-2.5 text-sm font-semibold text-[#FFC107] hover:bg-[#FFC107]/20 transition-colors disabled:opacity-50"
          >
            <AlertTriangle className="h-4 w-4" />
            {warnLoading ? 'Warning...' : 'Warn User'}
          </button>
          <button
            onClick={handleRemoveContent}
            disabled={removeLoading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            {removeLoading ? 'Removing...' : 'Remove Content'}
          </button>
        </div>
      </div>
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

export default function AdminReportsPage() {
  const { data: reportsData, isLoading, error } = useAdminReports();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  // Use real data from API
  const reports = reportsData?.data || reportsData || [];

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter((report: any) => {
      const matchesSearch =
        (report.id?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (report.post?.author?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (report.post?.community?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      const matchesType = selectedType === 'all' || report.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [reports, searchQuery, selectedType, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      ABUSE: 'bg-red-100 text-red-700',
      SPAM: 'bg-blue-100 text-blue-700',
      HARASSMENT: 'bg-orange-100 text-orange-700',
      MISINFORMATION: 'bg-purple-100 text-purple-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'text-orange-700',
      RESOLVED: 'text-green-700',
      DISMISSED: 'text-slate-700',
    };
    return colors[status] || 'text-slate-700';
  };

  const getPendingCount = () => reports.filter((r: any) => r.status === 'PENDING').length;
  const getResolvedCount = () => reports.filter((r: any) => r.status === 'RESOLVED').length;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-[#043658]">Loading reports...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-red-600">Error loading reports</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#043658]">Content Moderation</h1>
          <p className="mt-1 text-sm text-[#6B7C93]">Review and resolve reported user content.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Pending Reports</p>
            <p className="text-3xl font-bold text-orange-700">{getPendingCount()}</p>
            <span className="inline-block mt-2 text-xs text-orange-600 font-medium">⚠️ Requires attention</span>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Resolved Today</p>
            <p className="text-3xl font-bold text-green-700">{getResolvedCount()}</p>
            <span className="inline-block mt-2 text-xs text-green-600 font-medium">✓ Completed</span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-semibold text-[#043658] mb-2 block">Search Reports</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#6B7C93]" />
                <input
                  type="text"
                  placeholder="Report ID, author, or community"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-[#E8EEF3]">
              {[
                { label: 'All Pending', value: 'PENDING', badge: getPendingCount() },
                { label: 'Spam', value: 'SPAM', badge: 0 },
                { label: 'Abuse', value: 'ABUSE', badge: 0 },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setSelectedStatus(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    selectedStatus === tab.value
                      ? 'border-[#043658] text-[#043658]'
                      : 'border-transparent text-[#6B7C93] hover:text-[#043658]'
                  }`}
                >
                  {tab.label}
                  {tab.badge > 0 && (
                    <span className="ml-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-semibold text-[#043658] mb-2 block">Report Type</label>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
              >
                <option value="all">All Types</option>
                <option value="ABUSE">Abuse</option>
                <option value="SPAM">Spam</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="MISINFORMATION">Misinformation</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
            <p className="text-sm font-semibold text-[#043658]">
              Showing {filteredReports.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredReports.length)} of {filteredReports.length} reports
            </p>
          </div>

          {/* Table Body */}
          {paginatedReports.length === 0 ? (
            <div className="p-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
              <p className="text-sm font-semibold text-[#043658]">No reports found</p>
              <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EEF3] bg-white">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Report ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Content</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Author</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Reported</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedReports.map((report: any) => (
                    <tr key={report.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Report ID */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-[#043658]">{report.id}</p>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getTypeColor(report.type)}`}>
                          {report.type}
                        </span>
                      </td>

                      {/* Content Preview */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#043658] line-clamp-2">{report.post?.content?.substring(0, 60) || 'N/A'}...</p>
                      </td>

                      {/* Author */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-[#043658]">{report.post?.author?.firstName} {report.post?.author?.lastName}</p>
                          <p className="text-xs text-[#6B7C93]">{report.post?.community?.name}</p>
                        </div>
                      </td>

                      {/* Reported */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#043658]">{new Date(report.createdAt).toLocaleDateString()}</p>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`text-sm font-semibold ${getStatusColor(report.status)}`}>
                          ● {report.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="rounded-lg p-2 text-[#6B7C93] hover:bg-[#F8FAFC] transition-colors"
                        >
                          <Eye className="h-4 w-4" />
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

      {/* Review Report Modal */}
      {selectedReport && (
        <ReviewReportModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </AdminLayout>
  );
}
