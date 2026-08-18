"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Eye, Edit, Trash2, Heart, MessageCircle, Paperclip,
  Search, ChevronDown, Plus, AlertCircle, Loader2, FileText,
  Image as ImageIcon, File, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getMyPosts } from "@/services/profile";
import { deletePost } from "@/services/community";
import { getMediaUrl } from "@/lib/media";
import { useConfirm } from "@/hooks/useConfirm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  views?: number;
  community?: { name: string };
  category?: { name: string };
  communityLikes?: Array<any>;
  comments?: Array<any>;
  attachments?: Array<{ type: string; url: string; fileName?: string }>;
  likesCount?: number;
}

export default function MyPostsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 10;

  const { data: posts = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: getMyPosts,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      toast.success("Post deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete post. Please try again.");
    },
  });

  // Calculate stats
  const totalPosts = posts.length;
  const totalLikes = posts.reduce((sum: number, post: any) => sum + (post.likesCount || post.communityLikes?.length || 0), 0);
  const totalComments = posts.reduce((sum: number, post: any) => sum + (post.comments?.length || 0), 0);
  const totalAttachments = posts.reduce((sum: number, post: any) => sum + (post.attachments?.length || 0), 0);

  // Get unique communities and categories
  const communities = useMemo(() => {
    const unique = new Set(posts.map((p: any) => p.community?.name).filter(Boolean));
    return Array.from(unique);
  }, [posts]);

  const categories = useMemo(() => {
    const unique = new Set(posts.map((p: any) => p.category?.name).filter(Boolean));
    return Array.from(unique);
  }, [posts]);

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((p: any) =>
        p.title.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
      );
    }

    // Community filter
    if (communityFilter !== "all") {
      filtered = filtered.filter((p: any) => p.community?.name === communityFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p: any) => p.category?.name === categoryFilter);
    }

    // Sort
    return [...filtered].sort((a: any, b: any) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, search, communityFilter, categoryFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  );

  const handleDelete = async (postId: string) => {
    const confirmed = await confirm.confirm({
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
    });
    
    if (!confirmed) return;
    
    try {
      await deleteMutation.mutateAsync(postId);
    } catch (error) {
      // Error toast is already shown in mutation
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <ConfirmDialog
        isOpen={confirm.isOpen}
        title={confirm.options.title}
        message={confirm.options.message}
        confirmText={confirm.options.confirmText}
        cancelText={confirm.options.cancelText}
        type={confirm.options.type}
        onConfirm={confirm.handleConfirm}
        onCancel={confirm.handleCancel}
      />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-sm text-[#043658] hover:underline mb-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Profile / MY CONTENT
                </Link>
                <h1 className="text-2xl font-bold text-[#043658]">My Posts</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Manage and review the posts you&apos;ve shared with the ServeLink community.
                </p>
              </div>
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#032d4a] transition-colors"
              >
                <Plus className="h-4 w-4" />
                New Post
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                TOTAL POSTS
              </div>
              <div className="text-2xl font-bold text-[#043658]">{totalPosts}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                LIKES RECEIVED
              </div>
              <div className="text-2xl font-bold text-[#043658]">{totalLikes}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                COMMENTS
              </div>
              <div className="text-2xl font-bold text-[#043658]">{totalComments}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                ATTACHMENTS
              </div>
              <div className="text-2xl font-bold text-[#043658]">{totalAttachments}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm focus:border-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/10"
              />
            </div>
            <select
              value={communityFilter}
              onChange={(e) => setCommunityFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-[#043658] focus:outline-none"
            >
              <option value="all">All Communities</option>
              {communities.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-[#043658] focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm focus:border-[#043658] focus:outline-none"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>

          {/* Posts List */}
          <div className="rounded-lg border border-slate-200 bg-white">
            {isError ? (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-sm font-semibold text-slate-700">Failed to load posts</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 px-4 py-2 bg-[#043658] text-white rounded-lg text-sm hover:bg-[#032d4a]"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-sm font-semibold text-slate-700">No posts found</p>
                <p className="text-xs text-slate-500 mt-1">
                  {search || communityFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first post to get started"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginatedPosts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {post.attachments && post.attachments.length > 0 ? (
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                            {post.attachments[0].type === "IMAGE" ? (
                              <img
                                src={getMediaUrl((post.attachments[0] as any).url)}
                                alt={post.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <File className="h-6 w-6 text-slate-400" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <FileText className="h-6 w-6 text-slate-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                              <span className="font-semibold text-[#043658]">
                                {post.community?.name || "Community"}
                              </span>
                              <span>•</span>
                              <span>{post.category?.name || "Category"}</span>
                              <span>•</span>
                              <span>{formatDate(post.createdAt)}</span>
                            </div>
                            <h3 className="font-semibold text-[#043658] text-sm mb-1 line-clamp-1">
                              {post.title}
                            </h3>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {post.description}
                            </p>
                          </div>
                        </div>

                        {/* Stats and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              <span>{post.likesCount || post.communityLikes?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              <span>{post.comments?.length || 0}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3.5 w-3.5" />
                              <span>{post.attachments?.length || 0}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/community/post/${post.id}`)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#043658] hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </button>
                            <button
                              onClick={() => router.push(`/community/post/edit/${post.id}`)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#043658] hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <Edit className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(post.id)}
                              disabled={deleteMutation.isPending}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * postsPerPage + 1} to{" "}
                  {Math.min(currentPage * postsPerPage, filteredPosts.length)} of{" "}
                  {filteredPosts.length} posts
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-slate-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
