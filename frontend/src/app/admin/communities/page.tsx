'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Plus, MoreVertical, Users, MessageCircle, X } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { createCommunity } from '@/services/admin';
import { toast } from 'sonner';

interface Community {
  id: string;
  name: string;
  type: 'NATIONAL' | 'REGION' | 'ZONE' | 'WOREDA' | 'SCHOOL';
  members: number;
  posts: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  description?: string;
}

// Mock data for demonstration
const MOCK_COMMUNITIES: Community[] = [
  {
    id: '1',
    name: 'Addis Ketema Woreda 1',
    type: 'WOREDA',
    members: 452,
    posts: 1204,
    status: 'ACTIVE',
    createdAt: '2025-07-01',
    description: 'Educational community for Addis Ketema Woreda',
  },
  {
    id: '2',
    name: 'Addis Ababa Region',
    type: 'REGION',
    members: 8234,
    posts: 15420,
    status: 'ACTIVE',
    createdAt: '2025-06-15',
    description: 'Regional community for Addis Ababa',
  },
  {
    id: '3',
    name: 'Menelik II Secondary',
    type: 'SCHOOL',
    members: 84,
    posts: 312,
    status: 'ACTIVE',
    createdAt: '2025-08-01',
    description: 'School community for Menelik II Secondary',
  },
  {
    id: '4',
    name: 'Yekabit 12 Prep',
    type: 'SCHOOL',
    members: 112,
    posts: 458,
    status: 'ACTIVE',
    createdAt: '2025-08-05',
    description: 'School community for Yekabit 12 Prep',
  },
  {
    id: '5',
    name: 'Karad Zone',
    type: 'ZONE',
    members: 3421,
    posts: 8932,
    status: 'ACTIVE',
    createdAt: '2025-07-20',
    description: 'Zonal community for Karad',
  },
  {
    id: '6',
    name: 'National Teachers Hub',
    type: 'NATIONAL',
    members: 15234,
    posts: 42156,
    status: 'ACTIVE',
    createdAt: '2025-05-01',
    description: 'National community for all teachers',
  },
];

const ITEMS_PER_PAGE = 10;

export default function AdminCommunitiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newCommunity, setNewCommunity] = useState({
    name: '',
    description: '',
    type: 'WOREDA',
    subtype: '',
    isActive: true,
  });

  // Filter communities
  const filteredCommunities = useMemo(() => {
    return MOCK_COMMUNITIES.filter((community) => {
      const matchesSearch =
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || community.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || community.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchQuery, selectedType, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredCommunities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCommunities = filteredCommunities.slice(startIndex, endIndex);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
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
      NATIONAL: '🌍',
      REGION: '🗂️',
      ZONE: '📍',
      WOREDA: '🏘️',
      SCHOOL: '🏫',
    };
    return icons[type] || '📌';
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
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
            <Plus className="h-4 w-4" />
            New Community
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">National</div>
            <p className="text-2xl font-bold text-[#043658]">1</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Region</div>
            <p className="text-2xl font-bold text-[#043658]">2</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Zone</div>
            <p className="text-2xl font-bold text-[#043658]">8</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Woreda</div>
            <p className="text-2xl font-bold text-[#043658]">25</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">School</div>
            <p className="text-2xl font-bold text-[#043658]">120</p>
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
              Showing {filteredCommunities.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredCommunities.length)} of {filteredCommunities.length} communities
            </p>
          </div>

          {/* Table Body */}
          {paginatedCommunities.length === 0 ? (
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
                  {paginatedCommunities.map((community) => (
                    <tr key={community.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Community Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F8FAFC] text-lg">
                            {getTypeIcon(community.type)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#043658]">{community.name}</p>
                            <p className="text-xs text-[#6B7C93]">{community.description}</p>
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
                          {community.members.toLocaleString()}
                        </div>
                      </td>

                      {/* Posts */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#043658]">
                          <MessageCircle className="h-4 w-4 text-[#6B7C93]" />
                          {community.posts.toLocaleString()}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(community.status)}
                          <span className={`text-sm font-medium ${community.status === 'ACTIVE' ? 'text-green-700' : 'text-red-700'}`}>
                            {community.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
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
                    subtype: '',
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
                        subtype: '',
                        isActive: true,
                      });
                      window.location.reload();
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
                      subtype: '',
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
