"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  SquarePen,
  Trash2,
  Flag,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import {
  getPostById,
  likePost,
  unlikePost,
  bookmarkPost,
  removeBookmark,
  deletePost,
} from "@/services/community";
import { getPostComments, createComment } from "@/services/comment.service";
import { getTeacherPosts } from "@/services/teachers";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/useConfirm";
import { PostAuthor } from "@/components/post/PostAuthor";
import { PostActions } from "@/components/post/PostActions";
import { PostAttachment } from "@/components/post/PostAttachment";
import { PostTags } from "@/components/post/PostTags";

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const { status } = useVerification();
  const isVerified = status?.verificationStatus === "APPROVED";
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [lightboxImage]);

  const { data: post, isLoading: postLoading, isError: postError } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
  });

  const teacherId = post?.teacher?.id;
  const { data: teacherPostsData } = useQuery({
    queryKey: ["teacher-posts", teacherId],
    queryFn: () => getTeacherPosts(teacherId),
    enabled: !!teacherId,
  });
  
  const teacherPosts = teacherPostsData?.posts || [];
  const morePosts = teacherPosts.filter((p: any) => p.id !== postId).slice(0, 3);

  const likeMutation = useMutation({
    mutationFn: (isLiked: boolean) => (isLiked ? unlikePost(postId) : likePost(postId)),
    onSuccess: (_, isLiked) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      if (isLiked) {
        toast("Removed like");
      } else {
        toast.success("Post liked!");
      }
    },
    onError: () => {
      toast.error("Failed to update like");
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (isBookmarked: boolean) =>
      isBookmarked ? removeBookmark(postId) : bookmarkPost(postId),
    onSuccess: (_, isBookmarked) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      if (isBookmarked) {
        toast("Removed from bookmarks");
      } else {
        toast.success("Added to bookmarks!");
      }
    },
    onError: () => {
      toast.error("Failed to update bookmark");
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment({ postId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      setCommentText("");
      toast.success("Comment posted!");
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      toast.success("Post deleted successfully");
      router.push("/profile/posts");
    },
    onError: () => {
      toast.error("Failed to delete post");
    },
  });

  const handleLike = () => {
    if (!post) return;
    if (!isVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-verification-modal"));
      }
      return;
    }
    likeMutation.mutate(!!post.liked);
  };

  const handleBookmark = () => {
    if (!post) return;
    if (!isVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-verification-modal"));
      }
      return;
    }
    bookmarkMutation.mutate(!!post.bookmarked);
  };

  const handleComment = () => {
    const content = commentText.trim();
    if (!content) return;
    if (!isVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-verification-modal"));
      }
      return;
    }
    commentMutation.mutate(content);
  };

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Are you sure you want to delete this post?",
      message: "This action cannot be undone. All comments and interactions will be permanently removed.",
      type: "danger",
    });
    if (confirmed) {
      deleteMutation.mutate();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (postLoading) {
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

  if (postError || !post) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-sm font-semibold text-slate-700">Post not found</p>
            <Link href="/community" className="px-4 py-2 bg-[#043658] text-white rounded-lg text-sm hover:bg-[#032d4a]">
              Back to Community
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user?.id === post.teacher?.id;
  const likesCount = post.likesCount || post.communityLikes?.length || 0;
  const commentsCount = comments.length;
  const teacherName = post.teacher ? `${post.teacher.firstName} ${post.teacher.lastName}` : "Teacher";

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link
              href="/community"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#043658] hover:text-[#FFC107] transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Left Column (Main Content & Discussion) */}
            <div className="space-y-6">
              {/* Post Card */}
              <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="p-6 sm:p-8">
                  {/* Top Tags & Views */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        {post.category?.name || "Category"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-100">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {post.community?.name || "Community"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
                      <Eye className="h-4 w-4" />
                      {post.views ?? 0} Views
                    </div>
                  </div>

                  {/* Author block with menu */}
                  <div className="relative flex w-full items-start justify-between mb-8">
                    <PostAuthor
                      teacher={post.teacher ?? { firstName: "", lastName: "" }}
                      community={post.community}
                      createdAt={post.createdAt}
                      showMenu
                      onMenuClick={() => setMenuOpen((prev) => !prev)}
                      isOwner={isOwner}
                    />

                    {menuOpen && (
                      <>
                        <div className="fixed inset-0 z-[5]" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-11 z-10 min-w-[160px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                          {isOwner ? (
                            <>
                              <Link
                                href={`/community/post/edit/${post.id}`}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#043658]"
                              >
                                <SquarePen className="h-4 w-4" />
                                Edit Post
                              </Link>
                              <button
                                type="button"
                                onClick={handleDelete}
                                disabled={deleteMutation.isPending}
                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Post
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setMenuOpen(false);
                                toast("Report feature coming soon");
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-amber-700 transition hover:bg-amber-50"
                            >
                              <Flag className="h-4 w-4" />
                              Report Post
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl sm:text-4xl font-['Lexend'] font-bold text-[#043658] leading-[1.3] tracking-tight mb-8">
                    {post.title}
                  </h1>

                  {/* Description */}
                  <div className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap mb-10">
                    {post.description}
                  </div>

                  {/* Attached Resources */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Attached Resources</h4>
                      <PostAttachment 
                        attachments={post.attachments} 
                        onImageClick={(url) => setLightboxImage(url)}
                      />
                    </div>
                  )}
                </div>

                {/* Actions bottom bar */}
                <div className="border-t border-slate-100 bg-white">
                  <PostActions
                    likes={likesCount}
                    liked={!!post.liked}
                    comments={commentsCount}
                    bookmarked={!!post.bookmarked}
                    bookmarkCount={post.bookmarks ?? 0}
                    views={post.views ?? 0}
                    isVerified={isVerified}
                    onLike={handleLike}
                    onComment={() => {
                      document.getElementById('comment-input')?.focus();
                    }}
                    onBookmark={handleBookmark}
                    isLiking={likeMutation.isPending}
                    isBookmarking={bookmarkMutation.isPending}
                  />
                </div>
              </article>

              {/* Discussion Section */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden p-6 sm:p-8">
                <h3 className="text-xl font-['Lexend'] font-bold text-[#043658] mb-6">
                  Discussion ({commentsCount})
                </h3>

                {/* Comment Input */}
                <div className="mb-8">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white shadow-sm">
                      {user?.firstName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="relative rounded-2xl border border-slate-200 bg-slate-50 transition-all focus-within:border-[#043658] focus-within:ring-2 focus-within:ring-[#043658]/20 focus-within:bg-white overflow-hidden">
                        <textarea
                          id="comment-input"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Write a comment..."
                          rows={3}
                          className="w-full bg-transparent px-4 py-3 text-sm text-[#043658] outline-none resize-none"
                        />
                        <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-t border-slate-100">
                          <div className="text-[11px] font-medium text-slate-500">
                            {!isVerified && (
                              <span className="flex items-center gap-1.5">
                                <svg className="h-3.5 w-3.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Get verified to access premium features
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleComment}
                            disabled={!commentText.trim() || commentMutation.isPending}
                            className="flex items-center gap-2 rounded-xl bg-[#043658] px-5 py-2 text-sm font-semibold text-white hover:bg-[#032742] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {commentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Post"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                {commentsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#043658] mx-auto" />
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                    <p className="text-sm font-medium text-[#043658]">No comments yet</p>
                    <p className="text-xs text-slate-500 mt-1">Be the first to start the discussion!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {comments.map((comment: any) => (
                      <div key={comment.id} className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-[#043658]">
                          {comment.teacher?.firstName?.charAt(0) || "T"}
                        </div>
                        <div className="flex-1">
                          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-[#043658]">
                                  {comment.teacher ? `${comment.teacher.firstName} ${comment.teacher.lastName}` : "Teacher"}
                                </span>
                                {comment.teacher?.verified && (
                                  <svg className="h-3.5 w-3.5 text-[#FFC107]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-slate-400">{formatDate(comment.createdAt)}</span>
                            </div>
                            <p className="text-[14px] text-slate-700 leading-relaxed mb-3">{comment.content}</p>
                            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                              <button className="flex items-center gap-1.5 hover:text-[#043658] transition-colors">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                Like
                              </button>
                              <button className="flex items-center gap-1.5 hover:text-[#043658] transition-colors">
                                Reply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* More from Author */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-['Lexend'] font-bold text-[#043658] mb-5">
                  More from {teacherName.split(' ')[0] || "Author"}
                </h3>
                
                <div className="space-y-5">
                  {morePosts.length > 0 ? (
                    morePosts.map((mp: any) => (
                      <Link key={mp.id} href={`/community/post/${mp.id}`} className="group block">
                        <h4 className="text-[13px] font-semibold text-[#043658] leading-snug group-hover:text-[#FFC107] transition-colors line-clamp-2 mb-1.5">
                          {mp.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                          <span>{formatDate(mp.createdAt)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span>{mp.views ?? 0} views</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No other posts found.</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Link 
                    href={`/profile/${post.teacher?.id}`}
                    className="block w-full py-2 text-center text-sm font-semibold text-[#043658] border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-[#043658] shadow-lg hover:bg-white transition-colors"
            >
              Close
            </button>
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="max-h-[85vh] w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
