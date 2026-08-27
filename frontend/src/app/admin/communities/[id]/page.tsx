'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, MessageCircle, AlertTriangle, Settings, ArrowLeft, Search, 
  Filter, MoreVertical, X, Shield, Ban, CheckCircle, Eye, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { toast } from 'sonner';
import { adminApi } from '@/lib/axios';

type Tab = 'overview' | 'members' | 'posts' | 'reports' | 'settings';

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
  communityMembers: Array<{
    id: string;
    status: string;
    teacher: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      level: string;
      school: string;
      department?: string;
    };
  }>;
}

export default function CommunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  const filteredMembers = community.communityMembers.filter((m: any) =>
    m.teacher.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.teacher.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedMembers = filteredMembers.slice(startIndex, endIndex);

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
            {/* Search */}
            <div className="border-b border-[#E8EEF3] p-4">
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#6B7C93]" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-[#6B7C93] hover:text-[#043658]">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Members Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EEF3] bg-[#F8FAFC]">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">School</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((member: any) => (
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
                        <button className="rounded-lg p-2 text-[#6B7C93] hover:bg-[#F8FAFC] transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
        )}

        {activeTab === 'posts' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-12 shadow-sm text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
            <p className="text-sm font-semibold text-[#043658]">Posts management coming soon</p>
            <p className="text-xs text-[#6B7C93] mt-1">This feature will allow you to moderate community posts</p>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-12 shadow-sm text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
            <p className="text-sm font-semibold text-[#043658]">Reports management coming soon</p>
            <p className="text-xs text-[#6B7C93] mt-1">This feature will allow you to review and resolve reports</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658] mb-4">Community Settings</h2>
            <div className="space-y-4">
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
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
