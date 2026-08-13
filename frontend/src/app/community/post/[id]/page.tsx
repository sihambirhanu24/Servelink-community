"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Edit, Trash2, Heart, MessageCircle, Bookmark,
  Share2, Eye, FileText, Download, Send, Loader2, AlertCircle,
  MoreVertical, Flag, ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import {
  getPostById,
  likePost,
  unlikePost,
  bookmarkPost,
  removeBookmark,
  deletePost,
} from "@/services/community";
import { getPostComments, createComment } from "@/services/comment.service";
import { getMediaUrl } from "@/lib/media";

const TRENDING_TOPICS = [
  "#AIEducation",
  "#STEMLearning",
  "#CurriculumDesign",
  "#EdTech",
];

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [commentText, setCommentText] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Fetch post
  const { data: post, isLoading: postLoading, isError: postError } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId),
    enabled: !!postId,
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: () => getPostComments(postId),
    enabled: !!postId,
  });

  // Mutations
  const likeMutation = useMutation({
    mutationFn: (isLiked: boolean) => (isLiked ? unlikePost(postId) : likePost(postId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: (isBookmarked: boolean) =>
      isBookmarked ? removeBookmark(postId) : bookmarkPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment({ postId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      setCommentText("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      router.push("/profile/posts");
    },
  });

  const handleLike = () => {
    if (!post) return;
    likeMutation.mutate(!!post.liked);
  };

  const handleBookmark = () => {
    if (!post) return;
    bookmarkMutation.mutate(!!post.bookmarked);
  };

  const handleComment = () => {
    const content = commentText.trim();
    if (!content) return;
    commentMutation.mutate(content);
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    deleteMutation.mutate();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post?.title,
        text: post?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
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

  const getFileIcon = (type: string) => {
    if (type === "PDF") return "📄";
    if (type === "DOCX") return "📝";
    if (type === "VIDEO") return "🎥";
    return "📎";
  };

  if (postLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar />
        <Topbar />
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
        <DashboardSidebar />
        <Topbar />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-sm font-semibold text-slate-700">Post not found</p>
            <Link
              href="/posts"
              className="px-4 py-2 bg-[#043658] text-white rounded-lg text-sm hover:bg-[#032d4a]"
            >
              Back to Posts
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = user?.id === post.teacher?.id;
  const likesCount = post.likesCount || post.communityLikes?.length || 0;
  const commentsCount = comments.length;

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Main Content */}
            <div>
              {/* Back Button */}
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-sm text-[#043658] hover:underline mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to My Posts
              </Link>

              {/* Post Card */}
              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-[#043658] flex items-center justify-center text-white font-semibold">
                        {post.teacher?.firstName?.charAt(0) || "T"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-[#043658]">
                            {post.teacher
                              ? `${post.teacher.firstName} ${post.teacher.lastName}`
                              : "Teacher"}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#FFC107]/20 text-[10px] font-bold text-[#043658]">
                            {post.teacher?.level || "LEVEL_1"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">
                          {post.community?.name} • {formatDate(post.createdAt)}
                        </p>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/community/post/edit/${post.id}`}
                          className="p-2 text-slate-400 hover:text-[#043658] hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold text-[#043658] mb-3">{post.title}</h1>

                  <div className="prose prose-sm max-w-none text-slate-700">
                    {post.description.split("\n").map((paragraph: string, idx: number) => (
                      <p key={idx} className="mb-2">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="p-6 border-b border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
                      Attachments
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {post.attachments.map((attachment: any) => (
                        <a
                          key={attachment.id}
                          href={getMediaUrl(attachment.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                          <div className="flex-shrink-0 text-3xl">
                            {getFileIcon(attachment.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#043658] truncate">
                              {attachment.fileName || "Attachment"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {attachment.fileSize
                                ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`
                                : attachment.type}
                            </p>
                          </div>
                          <Download className="h-4 w-4 text-slate-400 group-hover:text-[#043658]" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                          post.liked
                            ? "text-red-500 bg-red-50"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={post.liked ? "currentColor" : "none"}
                        />
                        <span className="text-sm font-medium">{likesCount}</span>
                      </button>

                      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{commentsCount}</span>
                      </button>

                      <button
                        onClick={handleBookmark}
                        disabled={bookmarkMutation.isPending}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                          post.bookmarked
                            ? "text-[#043658] bg-[#043658]/10"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Bookmark
                          className="h-4 w-4"
                          fill={post.bookmarked ? "currentColor" : "none"}
                        />
                        <span className="text-sm font-medium">
                          {post.bookmarked ? "Saved" : "Save"}
                        </span>
                      </button>
                    </div>

                    <button
                      onClick={handleShare}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-[#043658] mb-4">
                    Comments ({commentsCount})
                  </h3>

                  {/* Comment Input */}
                  <div className="mb-6">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#043658] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                        {user?.firstName?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Add a comment..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 text-sm focus:border-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/10 resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleComment}
                            disabled={!commentText.trim() || commentMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-[#043658] text-white rounded-lg text-sm font-medium hover:bg-[#032d4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {commentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {commentsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
                      </div>
                    ) : comments.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">
                          No comments yet. Be the first to comment!
                        </p>
                      </div>
                    ) : (
                      comments.map((comment: any) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="h-10 w-10 rounded-full bg-[#043658] flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {comment.teacher?.firstName?.charAt(0) || "T"}
                          </div>
                          <div className="flex-1">
                            <div className="bg-slate-50 rounded-lg px-4 py-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-sm text-[#043658]">
                                  {comment.teacher
                                    ? `${comment.teacher.firstName} ${comment.teacher.lastName}`
                                    : "Teacher"}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Trending Topics */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-[#043658] mb-3">Trending Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1.5 rounded-full bg-[#043658]/5 text-[#043658] text-xs font-medium hover:bg-[#043658]/10 cursor-pointer transition-colors"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Contributors */}
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h3 className="font-semibold text-[#043658] mb-3">Active Contributors</h3>
                <div className="space-y-3">
                  {[
                    { name: "Abeba Kebede", level: "LEVEL 3", badge: "yellow" },
                    { name: "Betelhem Alemu", level: "LEVEL 5", badge: "blue" },
                    { name: "Yonas Tadesse", level: "LEVEL 4", badge: "blue" },
                  ].map((contributor, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-[#043658] flex items-center justify-center text-white text-xs font-semibold">
                          {contributor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#043658]">
                            {contributor.name}
                          </p>
                          <p className="text-xs text-slate-500">Computer Science</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          contributor.badge === "yellow"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {contributor.level}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-sm text-[#043658] font-medium hover:underline">
                  View Leaderboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
