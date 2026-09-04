'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, MessageCircle, AlertTriangle, Settings, ArrowLeft, Search, 
  Filter, MoreVertical, X, Shield, Ban, CheckCircle, Eye, Trash2,
  ChevronLeft, ChevronRight, TrendingUp
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { toast } from 'sonner';
import { adminApi } from '@/lib/axios';

type Tab = 'overview' | 'members' | 'posts' | 'reports' | 'analytics' | 'settings';

interface Community {
  id: string;
  name: string;
  type: string;
  subtype: string;
  department?: string;
  school?: string;
  woreda?: string;
  zone?: string;
  region?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    communityMembers: number;
    posts: number;
  };
  communityMembers?: CommunityMember[];
}

interface CommunityMember {
  id: string;
  teacherId: string;
  communityId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level: string;
    school?: string;
    department?: string;
    status: string;
  };
}

export default function CommunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('all');
  const [postStatusFilter, setPostStatusFilter] = useState('all');
  const [postCurrentPage, setPostCurrentPage] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('all');
  const [reportCurrentPage, setReportCurrentPage] = useState(1);
  const [showAnalyticsTab, setShowAnalyticsTab] = useState(false);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    isActive: true,
  });
  const ITEMS_PER_PAGE = 10;

  // Fetch community details
  const { data: community, isLoading, refetch } = useQuery({
    queryKey: ['admin-community', params.id],
    queryFn: async () => {
      const response = await adminApi.get(`/admin/communities/${params.id}`);
      return response.data;
    },
    enabled: !!params.id,
  });

  // Update settings form when community data loads
  useEffect(() => {
    if (community) {
      setSettingsForm({
        name: community.name,
        description: community.description || '',
        isActive: community.isActive,
      });
    }
  }, [community]);

  // Fetch community members with server-side pagination
  const { data: membersData, isLoading: isLoadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['admin-community-members', params.id, currentPage, searchQuery, statusFilter, levelFilter],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('page', currentPage.toString());
      searchParams.append('pageSize', ITEMS_PER_PAGE.toString());
      if (searchQuery) searchParams.append('search', searchQuery);
      if (statusFilter !== 'all') searchParams.append('status', statusFilter);
      if (levelFilter !== 'all') searchParams.append('level', levelFilter);
      
      const response = await adminApi.get(`/admin/communities/${params.id}/members?${searchParams.toString()}`);
      return response.data;
    },
    enabled: !!params.id && activeTab === 'members',
  });

  const members = membersData?.data || [];
  const totalMembers = membersData?.meta?.total || 0;
  const totalPagesMembers = Math.ceil(totalMembers / ITEMS_PER_PAGE);

  // Fetch community posts
  const { data: postsData, isLoading: isLoadingPosts, refetch: refetchPosts } = useQuery({
    queryKey: ['admin-community-posts', params.id, postCurrentPage, postSearchQuery, postTypeFilter, postStatusFilter],
    queryFn: async () => {
      const postSearchParams = new URLSearchParams();
      postSearchParams.append('page', postCurrentPage.toString());
      postSearchParams.append('pageSize', ITEMS_PER_PAGE.toString());
      if (postSearchQuery) postSearchParams.append('search', postSearchQuery);
      if (postTypeFilter !== 'all') postSearchParams.append('postType', postTypeFilter);
      if (postStatusFilter !== 'all') postSearchParams.append('moderationStatus', postStatusFilter);
      
      const response = await adminApi.get(`/admin/communities/${params.id}/posts?${postSearchParams.toString()}`);
      return response.data;
    },
    enabled: !!params.id && activeTab === 'posts',
  });

  const posts = postsData?.data || [];
  const totalPosts = postsData?.meta?.total || 0;
  const totalPagesPosts = Math.ceil(totalPosts / ITEMS_PER_PAGE);

  // Fetch community reports
  const { data: reportsData, isLoading: isLoadingReports, refetch: refetchReports } = useQuery({
    queryKey: ['admin-community-reports', params.id, reportCurrentPage, reportStatusFilter],
    queryFn: async () => {
      const reportSearchParams = new URLSearchParams();
      reportSearchParams.append('page', reportCurrentPage.toString());
      reportSearchParams.append('pageSize', ITEMS_PER_PAGE.toString());
      if (reportStatusFilter !== 'all') reportSearchParams.append('status', reportStatusFilter);
      
      const response = await adminApi.get(`/admin/communities/${params.id}/reports?${reportSearchParams.toString()}`);
      return response.data;
    },
    enabled: !!params.id && activeTab === 'reports',
  });

  const reports = reportsData?.data || [];
  const totalReports = reportsData?.meta?.total || 0;
  const totalPagesReports = Math.ceil(totalReports / ITEMS_PER_PAGE);

  // Update member status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ memberId, status }: { memberId: string; status: 'APPROVED' | 'REJECTED' }) => {
      await adminApi.patch(`/admin/communities/${params.id}/members/${memberId}/status`, { status });
    },
    onSuccess: () => {
      toast.success('Member status updated');
      queryClient.invalidateQueries({ queryKey: ['admin-community-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      setShowStatusModal(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast.error('Failed to update status', {
        description: error.response?.data?.message || 'Please try again'
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await adminApi.delete(`/admin/communities/${params.id}/members/${memberId}`);
    },
    onSuccess: () => {
      toast.success('Member removed successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-community-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      setShowRemoveModal(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast.error('Failed to remove member', {
        description: error.response?.data?.message || 'Please try again'
      });
    },
  });

  // Update community settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string; isActive?: boolean }) => {
      await adminApi.patch(`/admin/communities/${params.id}`, data);
    },
    onSuccess: () => {
      toast.success('Community settings updated');
      queryClient.invalidateQueries({ queryKey: ['admin-community'] });
      setIsEditingSettings(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update settings', {
        description: error.response?.data?.message || 'Please try again'
      });
    },
  });

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

  const getCommunityLocation = (comm: Community) => {
    const parts: string[] = [];
    if (comm.school) parts.push(comm.school);
    if (comm.woreda) parts.push(comm.woreda);
    if (comm.zone) parts.push(comm.zone);
    if (comm.region) parts.push(comm.region);
    if (comm.department) parts.push(`(${comm.department})`);
    return parts.join(', ') || 'No location specified';
  };

  const handleToggleActive = async () => {
    try {
      await adminApi.patch(`/admin/communities/${params.id}/toggle-active`);
      toast.success('Community status updated');
      refetch();
    } catch (error: any) {
      toast.error('Failed to update status', {
        description: error.response?.data?.message || 'Please try again'
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!community) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-lg font-semibold text-[#043658]">Community not found</p>
          <button 
            onClick={() => router.push('/admin/communities')}
            className="mt-4 text-[#043658] hover:underline"
          >
            Back to Communities
          </button>
        </div>
      </AdminLayout>
    );
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleLevelFilterChange = (value: string) => {
    setLevelFilter(value);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/communities')}
            className="rounded-lg p-2 text-[#6B7C93] hover:bg-[#F8FAFC] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#043658]">{community.name}</h1>
            <p className="text-sm text-[#6B7C93]">{getCommunityLocation(community)}</p>
          </div>
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getTypeColor(community.type)}`}>
            {community.type}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#D9E2EC]">
          {[
            { id: 'overview' as Tab, label: 'Overview', icon: Settings },
            { id: 'members' as Tab, label: 'Members', icon: Users },
            { id: 'posts' as Tab, label: 'Posts', icon: MessageCircle },
            { id: 'reports' as Tab, label: 'Reports', icon: AlertTriangle },
            { id: 'analytics' as Tab, label: 'Analytics', icon: TrendingUp },
            { id: 'settings' as Tab, label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#043658] text-[#043658]'
                  : 'border-transparent text-[#6B7C93] hover:text-[#043658]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Community Info */}
            <div className="md:col-span-2 rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#043658] mb-4">Community Overview</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Type</label>
                  <p className="text-sm font-medium text-[#043658] mt-1">{community.type}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Subtype</label>
                  <p className="text-sm font-medium text-[#043658] mt-1">{community.subtype}</p>
                </div>
                {community.department && (
                  <div>
                    <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Department</label>
                    <p className="text-sm font-medium text-[#043658] mt-1">{community.department}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Description</label>
                  <p className="text-sm text-[#043658] mt-1">{community.description || 'No description'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Status</label>
                  <p className="text-sm font-medium mt-1">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      community.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {community.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Created</label>
                    <p className="text-sm text-[#043658] mt-1">{new Date(community.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#6B7C93] uppercase tracking-wide">Last Updated</label>
                    <p className="text-sm text-[#043658] mt-1">{new Date(community.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10">
                    <Users className="h-5 w-5 text-[#043658]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#043658]">{community._count.communityMembers}</p>
                    <p className="text-xs text-[#6B7C93]">Total Members</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFC107]/10">
                    <MessageCircle className="h-5 w-5 text-[#FFC107]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#043658]">{community._count.posts}</p>
                    <p className="text-xs text-[#6B7C93]">Total Posts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm">
            {/* Search and Filters */}
            <div className="border-b border-[#E8EEF3] p-4 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#6B7C93]" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
                {searchQuery && (
                  <button onClick={() => handleSearchChange('')} className="text-[#6B7C93] hover:text-[#043658]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="flex-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <select
                  value={levelFilter}
                  onChange={(e) => handleLevelFilterChange(e.target.value)}
                  className="flex-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Levels</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              {isLoadingMembers ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
                  <p className="mt-4 text-sm font-semibold text-[#043658]">Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
                  <p className="text-sm font-semibold text-[#043658]">No members found</p>
                  <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8EEF3] bg-[#F8FAFC]">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">School</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member: any) => (
                      <tr key={member.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[#043658]">
                            {member.teacher.firstName} {member.teacher.lastName}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6B7C93]">{member.teacher.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block rounded-full bg-[#043658]/10 px-2 py-1 text-xs font-bold text-[#043658]">
                            {member.teacher.level}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-[#6B7C93]">{member.teacher.school || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            member.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                            member.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-[#6B7C93]">{new Date(member.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button 
                              onClick={() => setSelectedMember(member)}
                              className="rounded-lg p-2 text-[#6B7C93] hover:bg-[#F8FAFC] transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {selectedMember?.id === member.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[#D9E2EC] bg-white shadow-lg z-10">
                                <button
                                  onClick={() => {
                                    setShowStatusModal(true);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#043658] hover:bg-[#F8FAFC] transition-colors"
                                >
                                  <Shield className="h-4 w-4" />
                                  Change Status
                                </button>
                                <button
                                  onClick={() => {
                                    setShowRemoveModal(true);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Ban className="h-4 w-4" />
                                  Remove Member
                                </button>
                                <button
                                  onClick={() => setSelectedMember(null)}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[#6B7C93] hover:bg-[#F8FAFC] transition-colors border-t border-[#D9E2EC]"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPagesMembers > 1 && (
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
                  {Array.from({ length: Math.min(totalPagesMembers, 5) }, (_, i) => {
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
                  {totalPagesMembers > 5 && <span className="text-sm text-[#6B7C93]">...</span>}
                </div>
                <button
                  disabled={currentPage === totalPagesMembers}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm">
            {/* Search and Filters */}
            <div className="border-b border-[#E8EEF3] p-4 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#6B7C93]" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={postSearchQuery}
                  onChange={(e) => {
                    setPostSearchQuery(e.target.value);
                    setPostCurrentPage(1);
                  }}
                  className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
                {postSearchQuery && (
                  <button onClick={() => {
                    setPostSearchQuery('');
                    setPostCurrentPage(1);
                  }} className="text-[#6B7C93] hover:text-[#043658]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <select
                  value={postTypeFilter}
                  onChange={(e) => {
                    setPostTypeFilter(e.target.value);
                    setPostCurrentPage(1);
                  }}
                  className="flex-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Types</option>
                  <option value="QUESTION">Question</option>
                  <option value="DISCUSSION">Discussion</option>
                  <option value="RESOURCE">Resource</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
                <select
                  value={postStatusFilter}
                  onChange={(e) => {
                    setPostStatusFilter(e.target.value);
                    setPostCurrentPage(1);
                  }}
                  className="flex-1 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="VISIBLE">Visible</option>
                  <option value="HIDDEN">Hidden</option>
                  <option value="REMOVED">Removed</option>
                  <option value="REPORTED">Reported</option>
                </select>
              </div>
            </div>

            {/* Posts Table */}
            <div className="overflow-x-auto">
              {isLoadingPosts ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
                  <p className="mt-4 text-sm font-semibold text-[#043658]">Loading posts...</p>
                </div>
              ) : posts.length === 0 ? (
                <div className="p-12 text-center">
                  <MessageCircle className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
                  <p className="text-sm font-semibold text-[#043658]">No posts found</p>
                  <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8EEF3] bg-[#F8FAFC]">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Author</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Title/Content</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Likes</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Comments</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Reports</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map((post: any) => (
                      <tr key={post.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[#043658]">
                            {post.teacher.firstName} {post.teacher.lastName}
                          </p>
                          <p className="text-xs text-[#6B7C93]">{post.teacher.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-block rounded-full bg-[#043658]/10 px-2 py-1 text-xs font-bold text-[#043658]">
                            {post.postType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#043658] max-w-xs truncate">{post.title || post.description?.substring(0, 50)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6B7C93]">{post._count.communityLikes}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6B7C93]">{post._count.comments}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6B7C93]">{post._count.communityReports}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            post.moderationStatus === 'VISIBLE' ? 'bg-green-100 text-green-700' : 
                            post.moderationStatus === 'HIDDEN' ? 'bg-yellow-100 text-yellow-700' : 
                            post.moderationStatus === 'REMOVED' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {post.moderationStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-[#6B7C93]">{new Date(post.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <button className="rounded-lg p-2 text-[#6B7C93] hover:bg-[#F8FAFC] transition-colors">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPagesPosts > 1 && (
              <div className="border-t border-[#E8EEF3] bg-[#F8FAFC] px-6 py-4 flex items-center justify-between">
                <button
                  disabled={postCurrentPage === 1}
                  onClick={() => setPostCurrentPage(postCurrentPage - 1)}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPagesPosts, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPostCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded text-sm font-semibold transition-colors ${
                          postCurrentPage === pageNum
                            ? 'bg-[#043658] text-white'
                            : 'text-[#043658] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPagesPosts > 5 && <span className="text-sm text-[#6B7C93]">...</span>}
                </div>
                <button
                  disabled={postCurrentPage === totalPagesPosts}
                  onClick={() => setPostCurrentPage(postCurrentPage + 1)}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm">
            {/* Filter */}
            <div className="border-b border-[#E8EEF3] p-4">
              <select
                value={reportStatusFilter}
                onChange={(e) => {
                  setReportStatusFilter(e.target.value);
                  setReportCurrentPage(1);
                }}
                className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="RESOLVED">Resolved</option>
                <option value="DISMISSED">Dismissed</option>
              </select>
            </div>

            {/* Reports Table */}
            <div className="overflow-x-auto">
              {isLoadingReports ? (
                <div className="p-12 text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
                  <p className="mt-4 text-sm font-semibold text-[#043658]">Loading reports...</p>
                </div>
              ) : reports.length === 0 ? (
                <div className="p-12 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
                  <p className="text-sm font-semibold text-[#043658]">No reports found</p>
                  <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8EEF3] bg-[#F8FAFC]">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Reporter</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Reported User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Content</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report: any) => (
                      <tr key={report.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[#043658]">
                            {report.teacher.firstName} {report.teacher.lastName}
                          </p>
                          <p className="text-xs text-[#6B7C93]">{report.teacher.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-[#043658]">
                            {report.post?.teacher?.firstName} {report.post?.teacher?.lastName}
                          </p>
                          <p className="text-xs text-[#6B7C93]">{report.post?.teacher?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#043658] max-w-xs truncate">{report.post?.title || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-[#6B7C93]">{report.reason}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                            report.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 
                            report.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-[#6B7C93]">{new Date(report.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          {report.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  adminApi.patch(`/admin/reports/${report.id}/resolve`)
                                    .then(() => {
                                      toast.success('Report resolved');
                                      refetchReports();
                                    })
                                    .catch((error) => {
                                      toast.error('Failed to resolve report', {
                                        description: error.response?.data?.message || 'Please try again'
                                      });
                                    });
                                }}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-50 transition-colors border border-green-200"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => {
                                  adminApi.patch(`/admin/reports/${report.id}/dismiss`)
                                    .then(() => {
                                      toast.success('Report dismissed');
                                      refetchReports();
                                    })
                                    .catch((error) => {
                                      toast.error('Failed to dismiss report', {
                                        description: error.response?.data?.message || 'Please try again'
                                      });
                                    });
                                }}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                          {report.status !== 'PENDING' && (
                            <span className="text-xs text-[#6B7C93]">Closed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPagesReports > 1 && (
              <div className="border-t border-[#E8EEF3] bg-[#F8FAFC] px-6 py-4 flex items-center justify-between">
                <button
                  disabled={reportCurrentPage === 1}
                  onClick={() => setReportCurrentPage(reportCurrentPage - 1)}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPagesReports, 5) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setReportCurrentPage(pageNum)}
                        className={`h-8 w-8 rounded text-sm font-semibold transition-colors ${
                          reportCurrentPage === pageNum
                            ? 'bg-[#043658] text-white'
                            : 'text-[#043658] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPagesReports > 5 && <span className="text-sm text-[#6B7C93]">...</span>}
                </div>
                <button
                  disabled={reportCurrentPage === totalPagesReports}
                  onClick={() => setReportCurrentPage(reportCurrentPage + 1)}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-3 py-2 text-sm font-medium text-[#043658] hover:bg-white disabled:opacity-50"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658] mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Community Analytics
            </h2>
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
                <p className="mt-4 text-sm font-semibold text-[#043658]">Loading analytics...</p>
              </div>
            ) : !community ? (
              <div className="p-12 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
                <p className="text-sm font-semibold text-[#043658]">Unable to load community analytics</p>
                <p className="text-xs text-[#6B7C93] mt-1">Community not found or access denied</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Total Members</div>
                    <p className="text-2xl font-bold text-[#043658]">{community._count?.communityMembers || 0}</p>
                  </div>
                  <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Total Posts</div>
                    <p className="text-2xl font-bold text-[#043658]">{community._count?.posts || 0}</p>
                  </div>
                  <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Community Type</div>
                    <p className="text-2xl font-bold text-[#043658]">{community.type}</p>
                  </div>
                  <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Status</div>
                    <p className="text-2xl font-bold text-[#043658]">{community.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-[#F8FAFC] rounded-lg">
                  <p className="text-sm text-[#6B7C93]">
                    Detailed analytics with historical trends and engagement metrics will be available in future updates.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#043658]">Community Settings</h2>
              {!isEditingSettings && (
                <button
                  onClick={() => setIsEditingSettings(true)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#043658] text-white hover:bg-[#05456F] transition-colors"
                >
                  Edit Settings
                </button>
              )}
            </div>
            <div className="space-y-4">
              {isEditingSettings ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Community Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none resize-none transition-all"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={settingsForm.isActive}
                      onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-[#043658] focus:ring-[#043658]"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Active (members can join immediately)
                    </label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => updateSettingsMutation.mutate(settingsForm)}
                      disabled={updateSettingsMutation.isPending}
                      className="flex-1 px-5 py-2.5 bg-[#043658] text-white rounded-lg hover:bg-[#05456F] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      {updateSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingSettings(false);
                        setSettingsForm({
                          name: community.name,
                          description: community.description || '',
                          isActive: community.isActive,
                        });
                      }}
                      disabled={updateSettingsMutation.isPending}
                      className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#043658]">Community Name</p>
                      <p className="text-xs text-[#6B7C93]">{community.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#043658]">Description</p>
                      <p className="text-xs text-[#6B7C93]">{community.description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#043658]">Community Status</p>
                      <p className="text-xs text-[#6B7C93]">
                        {community.isActive ? 'Community is active and visible to teachers' : 'Community is inactive and hidden from teachers'}
                      </p>
                    </div>
                    <button
                      onClick={handleToggleActive}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        community.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {community.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#043658]">Community Type</p>
                      <p className="text-xs text-[#6B7C93]">{community.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#043658]">Subtype</p>
                      <p className="text-xs text-[#6B7C93]">{community.subtype}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-[#043658]">Created</p>
                      <p className="text-xs text-[#6B7C93]">{new Date(community.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Change Modal */}
      {showStatusModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-[#043658] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Change Member Status</h3>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedMember(null);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658]/10 text-[#043658] font-bold">
                  {selectedMember.teacher.firstName[0]}{selectedMember.teacher.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#043658]">
                    {selectedMember.teacher.firstName} {selectedMember.teacher.lastName}
                  </p>
                  <p className="text-xs text-[#6B7C93]">{selectedMember.teacher.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Status</label>
                <select
                  value={selectedMember.status}
                  onChange={(e) => setSelectedMember({ ...selectedMember, status: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-[#043658] focus:ring-2 focus:ring-[#043658]/20 outline-none transition-all"
                >
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateStatusMutation.mutate({ memberId: selectedMember.id, status: selectedMember.status })}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 px-5 py-2.5 bg-[#043658] text-white rounded-lg hover:bg-[#05456F] disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedMember(null);
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Modal */}
      {showRemoveModal && selectedMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-red-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Remove Member</h3>
              <button
                onClick={() => {
                  setShowRemoveModal(false);
                  setSelectedMember(null);
                }}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#F8FAFC] rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658]/10 text-[#043658] font-bold">
                  {selectedMember.teacher.firstName[0]}{selectedMember.teacher.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#043658]">
                    {selectedMember.teacher.firstName} {selectedMember.teacher.lastName}
                  </p>
                  <p className="text-xs text-[#6B7C93]">{selectedMember.teacher.email}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This will remove the member from the community. Their teacher account will NOT be deleted. They can rejoin the community if allowed.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => removeMemberMutation.mutate(selectedMember.id)}
                  disabled={removeMemberMutation.isPending}
                  className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  {removeMemberMutation.isPending ? 'Removing...' : 'Remove Member'}
                </button>
                <button
                  onClick={() => {
                    setShowRemoveModal(false);
                    setSelectedMember(null);
                  }}
                  disabled={removeMemberMutation.isPending}
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
