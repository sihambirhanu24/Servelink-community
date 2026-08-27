'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, MoreVertical, Users, MessageCircle, X, AlertTriangle, TrendingUp, Network, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { createCommunity } from '@/services/admin';
import { toast } from 'sonner';
import { adminApi } from '@/lib/axios';

type ViewMode = 'list' | 'hierarchy';

interface Community {
  id: string;
  name: string;
  type: 'NETWORK' | 'NATIONAL' | 'REGION' | 'ZONE' | 'WOREDA' | 'SCHOOL';
  subtype: 'COMMON' | 'DEPARTMENT';
  department?: string;
  school?: string;
  woreda?: string;
  zone?: string;
  region?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    communityMembers: number;
    posts: number;
  };
}

interface CommunityStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    NETWORK: number;
    NATIONAL: number;
    REGION: number;
    ZONE: number;
    WOREDA: number;
    SCHOOL: number;
  };
  totalMembers: number;
  totalPosts: number;
  pendingReports: number;
}

const ITEMS_PER_PAGE = 10;

export default function AdminCommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    type: 'WOREDA',
    subtype: 'COMMON',
    department: '',
    school: '',
    woreda: '',
    zone: '',
    region: '',
    isActive: true,
  });

  // Fetch communities from API
  const { data: communitiesData, isLoading: isLoadingCommunities, refetch: refetchCommunities } = useQuery({
    queryKey: ['admin-communities', selectedType, selectedStatus, searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('isActive', selectedStatus);
      params.append('page', currentPage.toString());
      params.append('pageSize', ITEMS_PER_PAGE.toString());
      
      const response = await adminApi.get(`/admin/communities?${params.toString()}`);
      return response.data;
    },
  });

  // Fetch community stats from API
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-community-stats'],
    queryFn: async () => {
      const response = await adminApi.get('/admin/communities/stats');
      return response.data;
    },
  });

  const communities = communitiesData?.data || [];
  const totalCommunities = communitiesData?.meta?.total || 0;
  const stats = statsData || {
    total: 0,
    active: 0,
    inactive: 0,
    byType: { NETWORK: 0, NATIONAL: 0, REGION: 0, ZONE: 0, WOREDA: 0, SCHOOL: 0 },
    totalMembers: 0,
    totalPosts: 0,
    pendingReports: 0,
  };

  // Pagination
  const totalPages = Math.ceil(totalCommunities / ITEMS_PER_PAGE);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      NETWORK: 'bg-indigo-100 text-indigo-700',
      NATIONAL: 'bg-blue-100 text-blue-700',
      REGION: 'bg-purple-100 text-purple-700',
      ZONE: 'bg-amber-100 text-amber-700',
      WOREDA: 'bg-green-100 text-green-700',
      SCHOOL: 'bg-red-100 text-red-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      NETWORK: '🌐',
      NATIONAL: '🌍',
      REGION: '🗂️',
      ZONE: '📍',
      WOREDA: '🏘️',
      SCHOOL: '🏫',
    };
    return icons[type] || '📌';
  };

  const getCommunityLocation = (community: Community) => {
    const parts: string[] = [];
    if (community.school) parts.push(community.school);
    if (community.woreda) parts.push(community.woreda);
    if (community.zone) parts.push(community.zone);
    if (community.region) parts.push(community.region);
    if (community.department) parts.push(`(${community.department})`);
    return parts.join(', ') || 'No location specified';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'ACTIVE') return <span className="h-2 w-2 rounded-full bg-green-500" />;
    return <span className="h-2 w-2 rounded-full bg-red-500" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Community Management</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Overview and administration of all ServeLink network tiers.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'list' ? 'hierarchy' : 'list')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                viewMode === 'hierarchy'
                  ? 'bg-[#043658] text-white'
                  : 'border border-[#D9E2EC] bg-white text-[#043658] hover:bg-[#F8FAFC]'
              }`}
            >
              <Network className="h-4 w-4" />
              {viewMode === 'hierarchy' ? 'List View' : 'Hierarchy View'}
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
              <Plus className="h-4 w-4" />
              New Community
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Network</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.byType.NETWORK}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">National</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.byType.NATIONAL}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Region</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.byType.REGION}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Zone</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.byType.ZONE}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Woreda</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.byType.WOREDA}</p>
          </div>
        </div>

        {/* Additional Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">School</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.byType.SCHOOL}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Total Members</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.totalMembers.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Total Posts</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.totalPosts.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Pending Reports</div>
            <p className="text-2xl font-bold text-[#043658]">{isLoadingStats ? '-' : stats.pendingReports}</p>
          </div>
        </div>

        {/* Hierarchy View */}
        {viewMode === 'hierarchy' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658] mb-4">Network Hierarchy</h2>
            <div className="space-y-2">
              {[
                { type: 'NETWORK', label: 'Network', icon: '🌐', color: 'bg-indigo-100 text-indigo-700' },
                { type: 'NATIONAL', label: 'National', icon: '🌍', color: 'bg-blue-100 text-blue-700' },
                { type: 'REGION', label: 'Regional', icon: '🗂️', color: 'bg-purple-100 text-purple-700' },
                { type: 'ZONE', label: 'Zone', icon: '📍', color: 'bg-amber-100 text-amber-700' },
                { type: 'WOREDA', label: 'Woreda', icon: '🏘️', color: 'bg-green-100 text-green-700' },
                { type: 'SCHOOL', label: 'School', icon: '🏫', color: 'bg-red-100 text-red-700' },
              ].map((level) => (
                <div key={level.type} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg text-lg">
                    {level.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#043658]">{level.label}</span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${level.color}`}>
                        {stats.byType[level.type as keyof typeof stats.byType] || 0}
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7C93]">{level.type.toLowerCase()} communities</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-[#6B7C93]" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Community Health Summary */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#043658] mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Community Health & Moderation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-lg p-4 ${stats.pendingReports > 10 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} border`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`h-4 w-4 ${stats.pendingReports > 10 ? 'text-red-600' : 'text-green-600'}`} />
                <span className="text-sm font-semibold text-[#043658]">Pending Reports</span>
              </div>
              <p className="text-2xl font-bold text-[#043658]">{stats.pendingReports}</p>
              <p className="text-xs text-[#6B7C93] mt-1">
                {stats.pendingReports > 10 ? 'Requires attention' : 'Within normal range'}
              </p>
            </div>
            <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-[#043658]" />
                <span className="text-sm font-semibold text-[#043658]">Active Communities</span>
              </div>
              <p className="text-2xl font-bold text-[#043658]">{stats.active}</p>
              <p className="text-xs text-[#6B7C93] mt-1">
                {stats.inactive} inactive
              </p>
            </div>
            <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-[#043658]" />
                <span className="text-sm font-semibold text-[#043658]">Avg Posts/Community</span>
              </div>
              <p className="text-2xl font-bold text-[#043658]">
                {stats.total > 0 ? (stats.totalPosts / stats.total).toFixed(1) : '0'}
              </p>
              <p className="text-xs text-[#6B7C93] mt-1">Total: {stats.totalPosts.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-semibold text-[#043658] mb-2 block">Search Communities</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#6B7C93]" />
                <input
                  type="text"
                  placeholder="Community name or description"
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Type */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Community Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => {
                    setSelectedType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Types</option>
                  <option value="NETWORK">Network</option>
                  <option value="NATIONAL">National</option>
                  <option value="REGION">Region</option>
                  <option value="ZONE">Zone</option>
                  <option value="WOREDA">Woreda</option>
                  <option value="SCHOOL">School</option>
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
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Communities Table Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
            <p className="text-sm font-semibold text-[#043658]">
              Showing {communities.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCommunities)} of {totalCommunities} communities
            </p>
          </div>

          {/* Table Body */}
          {isLoadingCommunities ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
              <p className="mt-4 text-sm font-semibold text-[#043658]">Loading communities...</p>
            </div>
          ) : communities.length === 0 ? (
            <div className="p-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
              <p className="text-sm font-semibold text-[#043658]">No communities found</p>
              <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EEF3] bg-white">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Community Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Members</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Posts</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.map((community: Community) => (
                    <tr key={community.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Community Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8FAFC] text-lg">
                            {getTypeIcon(community.type)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#043658]">{community.name}</p>
                            <p className="text-xs text-[#6B7C93]">{community.description || getCommunityLocation(community)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getTypeColor(community.type)}`}>
                          {community.type}
                        </span>
                      </td>

                      {/* Members */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#043658]">
                          <Users className="h-4 w-4 text-[#6B7C93]" />
                          {community._count?.communityMembers?.toLocaleString() || 0}
                        </div>
                      </td>

                      {/* Posts */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#043658]">
                          <MessageCircle className="h-4 w-4 text-[#6B7C93]" />
                          {community._count?.posts?.toLocaleString() || 0}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(community.isActive ? 'ACTIVE' : 'INACTIVE')}
                          <span className={`text-sm font-medium ${community.isActive ? 'text-green-700' : 'text-red-700'}`}>
                            {community.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => window.location.href = `/admin/communities/${community.id}`}
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors border border-[#D9E2EC]"
                        >
                          Manage
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

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
            <div className="bg-[#043658] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Create New Community</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewCommunity({
                    name: '',
                    description: '',
                    type: 'WOREDA',
                    subtype: 'COMMON',
                    department: '',
                    school: '',
                    woreda: '',
                    zone: '',
                    region: '',
                    isActive: true,
                  });
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Community Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCommunity.name}
                  onChange={(e) => setNewCommunity({ ...newCommunity, name: e.target.value })}
                  placeholder="Enter community name"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newCommunity.description}
                  onChange={(e) => setNewCommunity({ ...newCommunity, description: e.target.value })}
                  placeholder="Enter community description"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none resize-none transition-all"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Community Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={newCommunity.type}
                  onChange={(e) => setNewCommunity({ ...newCommunity, type: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none transition-all"
                >
                  <option value="NATIONAL">National</option>
                  <option value="REGION">Region</option>
                  <option value="ZONE">Zone</option>
                  <option value="WOREDA">Woreda</option>
                  <option value="SCHOOL">School</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subtype (Optional)
                </label>
                <input
                  type="text"
                  value={newCommunity.subtype}
                  onChange={(e) => setNewCommunity({ ...newCommunity, subtype: e.target.value })}
                  placeholder="e.g., Mathematics, Science"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newCommunity.isActive}
                  onChange={(e) => setNewCommunity({ ...newCommunity, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-[#043658] focus:ring-[#043658]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Active (members can join immediately)
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={async () => {
                    if (!newCommunity.name || !newCommunity.description) {
                      toast.error('Missing Fields', {
                        description: 'Please fill in all required fields'
                      });
                      return;
                    }
                    
                    setIsCreating(true);
                    try {
                      await createCommunity(newCommunity);
                      toast.success('Community Created!', {
                        description: 'The community has been created successfully'
                      });
                      setShowCreateModal(false);
                      setNewCommunity({
                        name: '',
                        description: '',
                        type: 'WOREDA',
                        subtype: 'COMMON',
                        department: '',
                        school: '',
                        woreda: '',
                        zone: '',
                        region: '',
                        isActive: true,
                      });
                      refetchCommunities();
                    } catch (error: any) {
                      console.error('Failed to create community:', error);
                      toast.error('Failed to Create Community', {
                        description: error.response?.data?.message || error.message || 'Please try again'
                      });
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  disabled={isCreating}
                  className="flex-1 px-5 py-2.5 bg-[#043658] text-white rounded-lg hover:bg-[#05456F] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {isCreating ? 'Creating...' : 'Create Community'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewCommunity({
                      name: '',
                      description: '',
                      type: 'WOREDA',
                      subtype: 'COMMON',
                      department: '',
                      school: '',
                      woreda: '',
                      zone: '',
                      region: '',
                      isActive: true,
                    });
                  }}
                  disabled={isCreating}
                  className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all font-semibold"
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
