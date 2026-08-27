'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, FileText, Eye, EyeOff, MessageCircle, Heart, Bookmark, Trash2, AlertTriangle, TrendingUp, Calendar, User, RotateCcw } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { toast } from 'sonner';
import { adminApi } from '@/lib/axios';

const ITEMS_PER_PAGE = 10;

interface PostStats {
  total: number;
  todayPosts: number;
  reported: number;
  underReview: number;
  removed: number;
  hidden: number;
}

interface Post {
  id: string;
  title: string;
  description: string;
  postType: string;
  moderationStatus: string;
  createdAt: string;
  views: number;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    level: string;
    verified: boolean;
    status: string;
    profileImage?: string;
  };
  community: {
    id: string;
    name: string;
    type: string;
    school?: string;
    woreda?: string;
    zone?: string;
    region?: string;
  };
  category: {
    id: string;
    name: string;
  };
  _count: {
    communityLikes: number;
    comments: number;
    communityBookmarks: number;
    communityReports: number;
  };
}

export default function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCommunityType, setSelectedCommunityType] = useState('all');
  const [selectedTeacherLevel, setSelectedTeacherLevel] = useState('all');
  const [selectedModerationStatus, setSelectedModerationStatus] = useState('all');
  const [selectedPostType, setSelectedPostType] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [selectedReportStatus, setSelectedReportStatus] = useState('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await adminApi.get('/community/categories');
      return response.data;
    },
  });
  const categories = categoriesData || [];

  // Fetch post stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-post-stats'],
    queryFn: async () => {
      const response = await adminApi.get('/admin/posts/stats');
      return response.data;
    },
  });
  const stats = statsData || {
    total: 0,
    todayPosts: 0,
    reported: 0,
    underReview: 0,
    removed: 0,
    hidden: 0,
  };

  const moderateMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: string; reason?: string }) => {
      const response = await adminApi.patch(`/admin/posts/${id}/moderate`, { action, reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Post updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-post-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update post');
    },
  });

  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Fetch posts from API
  const { data: postsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-posts', selectedCommunityType, selectedTeacherLevel, selectedModerationStatus, selectedPostType, selectedCategoryId, selectedReportStatus, selectedDateFilter, searchQuery, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCommunityType !== 'all') params.append('communityType', selectedCommunityType);
      if (selectedTeacherLevel !== 'all') params.append('teacherLevel', selectedTeacherLevel);
      if (selectedModerationStatus !== 'all') params.append('moderationStatus', selectedModerationStatus);
      if (selectedPostType !== 'all') params.append('postType', selectedPostType);
      if (selectedCategoryId !== 'all') params.append('categoryId', selectedCategoryId);
      if (selectedReportStatus !== 'all') params.append('reportStatus', selectedReportStatus);

      // Date filtering
      if (selectedDateFilter !== 'all') {
        const today = new Date();
        let dateFrom = new Date();
        
        if (selectedDateFilter === 'today') {
          dateFrom.setHours(0, 0, 0, 0);
        } else if (selectedDateFilter === '7days') {
          dateFrom.setDate(today.getDate() - 7);
        } else if (selectedDateFilter === '30days') {
          dateFrom.setDate(today.getDate() - 30);
        }
        
        params.append('dateFrom', dateFrom.toISOString());
      }

      params.append('page', currentPage.toString());
      params.append('pageSize', ITEMS_PER_PAGE.toString());

      const response = await adminApi.get(`/admin/posts?${params.toString()}`);
      return response.data;
    },
  });

  const posts = postsData?.data || [];
  const totalPosts = postsData?.meta?.total || 0;

  const getModerationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      REPORTED: 'bg-red-100 text-red-700',
      UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
      REMOVED: 'bg-slate-100 text-slate-700',
      HIDDEN: 'bg-purple-100 text-purple-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getPostTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      QUESTION: 'bg-blue-100 text-blue-700',
      DISCUSSION: 'bg-purple-100 text-purple-700',
      RESOURCE: 'bg-amber-100 text-amber-700',
      ANNOUNCEMENT: 'bg-red-100 text-red-700',
    };
    return colors[type] || 'bg-slate-100 text-slate-700';
  };

  const getCommunityTypeColor = (type: string) => {
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

  if (isLoadingStats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Post Management</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Manage and moderate community discussions across the platform.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
            <FileText className="h-4 w-4" />
            Export
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid.cols-5">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Total Posts</div>
            <p className="text-2xl font-bold text-[#043658]">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Today</div>
            <p className="text-2xl font-bold text-[#043658]">{stats.todayPosts}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Reported</div>
            <p className="text-2xl font-bold text-[#043658]">{stats.reported}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Under Review</div>
            <p className="text-2xl font-bold text-[#043658]">{stats.underReview}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Removed</div>
            <p className="text-2xl font-bold text-[#043658]">{stats.removed}</p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="text-sm font-semibold text-[#043658] mb-2 block">Search Posts</label>
              <div className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5">
                <Search className="h-4 w-4 text-[#6B7C93]" />
                <input
                  type="text"
                  placeholder="Search authors, content, or communities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-transparent text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none"
                />
              </div>
            </div>

            {/* Filter Row 1 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              {/* Community Type */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Community Type</label>
                <select
                  value={selectedCommunityType}
                  onChange={(e) => {
                    setSelectedCommunityType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Communities</option>
                  <option value="NETWORK">Network Community</option>
                  <option value="NATIONAL">National Community</option>
                  <option value="REGION">Regional Community</option>
                  <option value="ZONE">Zone Community</option>
                  <option value="WOREDA">Woreda Community</option>
                  <option value="SCHOOL">School Community</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Status</label>
                <select
                  value={selectedModerationStatus}
                  onChange={(e) => {
                    setSelectedModerationStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Statuses</option>
                  <option value="ACTIVE">Published</option>
                  <option value="HIDDEN">Hidden</option>
                  <option value="REMOVED">Deleted</option>
                  <option value="REPORTED">Reported</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Category</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => {
                    setSelectedCategoryId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Date Filter</label>
                <select
                  value={selectedDateFilter}
                  onChange={(e) => {
                    setSelectedDateFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 days</option>
                  <option value="30days">Last 30 days</option>
                </select>
              </div>
            </div>

            {/* Filter Row 2 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 items-end">
              {/* Report Filter */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Report Status</label>
                <select
                  value={selectedReportStatus}
                  onChange={(e) => {
                    setSelectedReportStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All</option>
                  <option value="NO_REPORTS">No reports</option>
                  <option value="REPORTED">Reported</option>
                  <option value="UNRESOLVED">Unresolved reports</option>
                  <option value="RESOLVED">Resolved reports</option>
                </select>
              </div>

              {/* Post Type */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Post Type</label>
                <select
                  value={selectedPostType}
                  onChange={(e) => {
                    setSelectedPostType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Types</option>
                  <option value="QUESTION">Question</option>
                  <option value="DISCUSSION">Discussion</option>
                  <option value="RESOURCE">Resource</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
              </div>

              {/* Teacher Level */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Teacher Level</label>
                <select
                  value={selectedTeacherLevel}
                  onChange={(e) => {
                    setSelectedTeacherLevel(e.target.value);
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

              {/* Clear Filters */}
              <div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCommunityType('all');
                    setSelectedTeacherLevel('all');
                    setSelectedModerationStatus('all');
                    setSelectedPostType('all');
                    setSelectedCategoryId('all');
                    setSelectedReportStatus('all');
                    setSelectedDateFilter('all');
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg bg-gray-100 hover:bg-gray-200 text-[#043658] font-semibold px-4 py-2.5 transition-colors text-sm border border-[#D9E2EC]"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
            <p className="text-sm font-semibold text-[#043658]">
              Showing {posts.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalPosts)} of {totalPosts} posts
            </p>
          </div>

          {/* Table Body */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#043658] border-r-transparent"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-[#D9E2EC] mb-4" />
              <p className="text-sm font-semibold text-[#043658]">No posts found</p>
              <p className="text-xs text-[#6B7C93] mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E8EEF3] bg-white">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Author & Content</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Community</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Engagement</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Reports</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post: Post) => (
                    <tr key={post.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Author & Content */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658]/10 text-sm font-bold text-[#043658] shrink-0">
                            {post.teacher.firstName?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[#043658]">
                                {post.teacher.firstName} {post.teacher.lastName}
                              </p>
                              {post.teacher.status === 'SUSPENDED' && (
                                <AlertTriangle className="h-3 w-3 text-red-600" />
                              )}
                            </div>
                            <p className="text-xs text-[#6B7C93]">@{post.teacher.email?.split('@')[0]}</p>
                            <p className="text-sm text-[#043658] font-medium mt-1 line-clamp-1">{post.title}</p>
                          </div>
                        </div>
                      </td>

                      {/* Community */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#043658]">{post.community.name}</p>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold mt-1 ${getCommunityTypeColor(post.community.type)}`}>
                          {post.community.type}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getPostTypeColor(post.postType)}`}>
                          {post.postType}
                        </span>
                      </td>

                      {/* Engagement */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-[#043658]" title="Views">
                            <Eye className="h-4 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post.views || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#043658]" title="Likes">
                            <Heart className="h-4 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post._count.communityLikes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#043658]" title="Comments">
                            <MessageCircle className="h-4 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post._count.comments || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#043658]" title="Bookmarks">
                            <Bookmark className="h-4 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post._count.communityBookmarks || 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* Reports */}
                      <td className="px-6 py-4">
                        {post._count.communityReports > 0 ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            {post._count.communityReports}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8EEF3] px-3 py-1 text-xs font-bold text-[#6B7C93]">
                            0
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getModerationStatusColor(post.moderationStatus)}`}>
                          {post.moderationStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === post.id ? null : post.id)}
                            className="p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical className="h-5 w-5 text-gray-500" />
                          </button>
                          
                          {openDropdownId === post.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                              <div className="py-1" role="menu">
                                <button
                                  onClick={() => { window.location.href = `/admin/posts/${post.id}`; setOpenDropdownId(null); }}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                  <FileText className="h-4 w-4" /> Review Post
                                </button>
                                {post.moderationStatus !== 'HIDDEN' && (
                                  <button
                                    onClick={() => { moderateMutation.mutate({ id: post.id, action: 'HIDE' }); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <EyeOff className="h-4 w-4" /> Hide
                                  </button>
                                )}
                                {(post.moderationStatus === 'HIDDEN' || post.moderationStatus === 'REMOVED') && (
                                  <button
                                    onClick={() => { moderateMutation.mutate({ id: post.id, action: 'RESTORE' }); setOpenDropdownId(null); }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <RotateCcw className="h-4 w-4" /> Restore
                                  </button>
                                )}
                                {post.moderationStatus !== 'REMOVED' && (
                                  <button
                                    onClick={() => {
                                      if(confirm('Are you sure you want to delete this post?')) {
                                        moderateMutation.mutate({ id: post.id, action: 'REMOVE' });
                                      }
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </button>
                                )}
                              </div>
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
          {Math.ceil(totalPosts / ITEMS_PER_PAGE) > 1 && (
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
                {Array.from({ length: Math.min(Math.ceil(totalPosts / ITEMS_PER_PAGE), 5) }, (_, i) => {
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
                {Math.ceil(totalPosts / ITEMS_PER_PAGE) > 5 && <span className="text-sm text-[#6B7C93]">...</span>}
              </div>
              <button
                disabled={currentPage === Math.ceil(totalPosts / ITEMS_PER_PAGE)}
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
