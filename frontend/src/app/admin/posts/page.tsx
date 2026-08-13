'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, FileText, Eye, MessageCircle, Heart, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';
import { useAdminPosts } from '@/hooks/useAdminPosts';
import { deleteAdminPost } from '@/services/admin';

const ITEMS_PER_PAGE = 10;

export default function AdminPostsPage() {
  const { data: postsData, isLoading, error, refetch } = useAdminPosts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Use real data from API
  const posts = postsData?.data || postsData || [];

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post: any) => {
      const matchesSearch =
        (post.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (post.author?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (post.community?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      const matchesCategory = selectedCategory === 'all' || post.category?.name === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [posts, searchQuery, selectedCategory, selectedStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPosts = filteredPosts.slice(startIndex, endIndex);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Questions: 'bg-blue-100 text-blue-700',
      Discussion: 'bg-purple-100 text-purple-700',
      Guide: 'bg-green-100 text-green-700',
      Resource: 'bg-amber-100 text-amber-700',
      Announcement: 'bg-red-100 text-red-700',
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PUBLISHED: 'bg-green-100 text-green-700',
      FLAGGED: 'bg-red-100 text-red-700',
      ARCHIVED: 'bg-slate-100 text-slate-700',
    };
    return colors[status] || 'bg-slate-100 text-slate-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PUBLISHED') return <span className="h-2 w-2 rounded-full bg-green-500" />;
    if (status === 'FLAGGED') return <span className="h-2 w-2 rounded-full bg-red-500" />;
    return <span className="h-2 w-2 rounded-full bg-slate-500" />;
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-[#043658]">Loading posts...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-lg font-semibold text-red-600">Error loading posts</p>
        </div>
      </AdminLayout>
    );
  }

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        setDeleting(postId);
        await deleteAdminPost(postId);
        refetch();
      } catch (err) {
        console.error('Error deleting post:', err);
      } finally {
        setDeleting(null);
      }
    }
  };

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

            {/* Filter Row */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Community */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Community</label>
                <select className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40">
                  <option value="all">All Communities</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-semibold text-[#043658] mb-2 block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-[#D9E2EC] bg-white px-3 py-2.5 text-sm text-[#043658] outline-none hover:border-[#043658]/40"
                >
                  <option value="all">All Categories</option>
                  <option value="Questions">Questions</option>
                  <option value="Discussion">Discussion</option>
                  <option value="Guide">Guide</option>
                  <option value="Resource">Resource</option>
                  <option value="Announcement">Announcement</option>
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
                  <option value="PUBLISHED">Published</option>
                  <option value="FLAGGED">Flagged</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Table Card */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-[#E8EEF3] bg-[#F8FAFC] px-6 py-3">
            <p className="text-sm font-semibold text-[#043658]">
              Showing {filteredPosts.length === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, filteredPosts.length)} of {filteredPosts.length} posts
            </p>
          </div>

          {/* Table Body */}
          {paginatedPosts.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Engagement</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6B7C93]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map((post: any) => (
                    <tr key={post.id} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      {/* Author & Content */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658]/10 text-sm font-bold text-[#043658] shrink-0">
                            {post.author?.firstName?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#043658]">
                              {post.author?.firstName} {post.author?.lastName}
                            </p>
                            <p className="text-xs text-[#6B7C93]">@{post.author?.email?.split('@')[0]}</p>
                            <p className="text-sm text-[#043658] font-medium mt-1 line-clamp-1">{post.title}</p>
                          </div>
                        </div>
                      </td>

                      {/* Community */}
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#043658]">{post.community?.name || 'N/A'}</p>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getCategoryColor(post.category?.name || '')}`}>
                          {post.category?.name || 'N/A'}
                        </span>
                      </td>

                      {/* Engagement */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-[#043658]">
                            <Eye className="h-4 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post.views || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#043658]">
                            <Heart className="h-4 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post.likes || 0}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[#043658]">
                            <MessageCircle className="h-2 w-4 text-[#6B7C93]" />
                            <span className="font-medium">{post.comments?.length || 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(post.status)}
                          <span className={`text-sm font-semibold inline-block rounded-full px-3 py-1 ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deleting === post.id}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
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
