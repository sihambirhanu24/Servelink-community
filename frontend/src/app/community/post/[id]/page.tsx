"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Edit, Trash2, Heart, MessageCircle, Bookmark,
  Share2, Eye, FileText, Download, Send, Loader2, AlertCircle,
  MoreVertical, Flag, ExternalLink, Sparkles, TrendingUp, Users, X
} from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
import { useToast } from "@/hooks/useToast";
import { useConfirm } from "@/hooks/useConfirm";

const TRENDING_TOPICS = [
  "#AIEducation",
  "#STEMLearning",
  "#CurriculumDesign",
  "#EdTech",
];

// Animation variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  hover: { y: -2, transition: { duration: 0.2 } }
};

const commentVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Close lightbox on ESC key
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [lightboxImage]);

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
    onSuccess: (_, isLiked) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      showToast(isLiked ? "Removed like" : "Post liked!", "success");
    },
    onError: () => {
      showToast("Failed to update like", "error");
    }
  });

  const bookmarkMutation = useMutation({
    mutationFn: (isBookmarked: boolean) =>
      isBookmarked ? removeBookmark(postId) : bookmarkPost(postId),
    onSuccess: (_, isBookmarked) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      showToast(isBookmarked ? "Removed from bookmarks" : "Added to bookmarks!", "success");
    },
    onError: () => {
      showToast("Failed to update bookmark", "error");
    }
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) => createComment({ postId, content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
      setCommentText("");
      showToast("Comment posted!", "success");
    },
    onError: () => {
      showToast("Failed to post comment", "error");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deletePost(postId),
    onSuccess: () => {
      showToast("Post deleted successfully", "success");
      router.push("/profile/posts");
    },
    onError: () => {
      showToast("Failed to delete post", "error");
    }
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

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Are you sure you want to delete this post?",
      message: "This action cannot be undone. All comments and interactions will be permanently removed.",
      type: "danger"
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
      showToast("Link copied to clipboard!", "success");
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
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#F5F8FB] via-[#F5F8FB] to-[#E8F0F7]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <motion.main 
        className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            {/* Main Content */}
            <div>
              {/* Back Button with Gradient */}
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 text-sm font-medium text-[#043658] hover:text-[#FFC107] transition-colors mb-4 group"
              >
                <div className="p-1 rounded-lg bg-white border border-[#043658]/10 group-hover:border-[#FFC107] transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </div>
                Back to My Posts
              </Link>

              {/* Post Card with Gradient Border */}
              <motion.div 
                className="rounded-2xl bg-gradient-to-br from-white via-white to-[#FFC107]/5 shadow-lg border border-[#043658]/10 overflow-hidden"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
              >
                {/* Gradient Top Bar */}
                <div className="h-1 bg-gradient-to-r from-[#043658] via-[#FFC107] to-[#043658]" />
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-white to-[#043658]/[0.02]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#043658] to-[#043658]/80 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {post.teacher?.firstName?.charAt(0) || "T"}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-br from-[#FFC107] to-amber-500 flex items-center justify-center">
                          <Sparkles className="h-2.5 w-2.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#043658]">
                            {post.teacher
                              ? `${post.teacher.firstName} ${post.teacher.lastName}`
                              : "Teacher"}
                          </h3>
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FFC107] to-amber-400 text-[10px] font-bold text-[#043658] shadow-sm">
                            {post.teacher?.level || "LEVEL_1"}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 flex items-center gap-2">
                          <span className="font-medium text-[#043658]">{post.community?.name}</span>
                          <span className="text-slate-300">•</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </p>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/community/post/edit/${post.id}`}
                          className="p-2.5 text-slate-400 hover:text-[#043658] hover:bg-[#043658]/5 rounded-xl transition-all hover:scale-110"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h1 className="text-3xl font-bold bg-gradient-to-r from-[#043658] to-[#043658]/80 bg-clip-text text-transparent mb-4 leading-tight">
                    {post.title}
                  </h1>

                  <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
                    {post.description.split("\n").map((paragraph: string, idx: number) => (
                      <p key={idx} className="mb-3">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Attachments */}
                {post.attachments && post.attachments.length > 0 && (
                  <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-white to-[#FFC107]/[0.02]">
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="h-4 w-4 text-[#043658]" />
                      <h4 className="text-sm font-bold text-[#043658] uppercase tracking-wide">
                        Attachments ({post.attachments.length})
                      </h4>
                    </div>
                    <div className="space-y-4">
                      {post.attachments.map((attachment: any, idx: number) => {
                        const mediaUrl = getMediaUrl(attachment.url);
                        const isImage = attachment.type === "IMAGE";
                        const isPDF = attachment.type === "PDF";
                        const isVideo = attachment.type === "VIDEO";
                        
                        return (
                          <motion.div
                            key={attachment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="rounded-xl border border-[#043658]/10 bg-white overflow-hidden shadow-sm"
                          >
                            {/* Image - Show thumbnail with click to open in new tab */}
                            {isImage && (
                              <div className="relative group">
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block cursor-pointer"
                                >
                                  <div className="relative h-64 overflow-hidden bg-slate-100">
                                    <img 
                                      src={mediaUrl} 
                                      alt={attachment.fileName || "Image attachment"}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      onError={(e) => {
                                        console.error('Image failed to load:', mediaUrl);
                                        e.currentTarget.src = 'https://placehold.co/800x400/043658/FFFFFF?text=Image+Not+Found';
                                      }}
                                    />
                                    {/* Simple overlay on hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                                  </div>
                                </a>
                                <div className="px-4 py-3 bg-gradient-to-r from-[#043658]/90 to-[#043658]/80 text-white flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{attachment.fileName || "Image"}</p>
                                    {attachment.fileSize && (
                                      <p className="text-xs text-white/70 mt-0.5">
                                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    )}
                                  </div>
                                  <a
                                    href={mediaUrl}
                                    download
                                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            {/* PDF - Show embedded viewer */}
                            {isPDF && (
                              <div>
                                <iframe
                                  src={`${mediaUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                                  className="w-full h-[600px] border-0"
                                  title={attachment.fileName || "PDF Document"}
                                />
                                <div className="px-4 py-3 bg-gradient-to-r from-red-500/90 to-red-600/90 text-white flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                                      📄 {attachment.fileName || "PDF Document"}
                                    </p>
                                    {attachment.fileSize && (
                                      <p className="text-xs text-white/70 mt-0.5">
                                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                    <a
                                      href={mediaUrl}
                                      download
                                      className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Video - Show video player */}
                            {isVideo && (
                              <div>
                                <video 
                                  controls 
                                  className="w-full h-auto"
                                  preload="metadata"
                                >
                                  <source src={mediaUrl} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                                <div className="px-4 py-3 bg-gradient-to-r from-purple-500/90 to-purple-600/90 text-white flex items-center justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold truncate flex items-center gap-2">
                                      🎥 {attachment.fileName || "Video"}
                                    </p>
                                    {attachment.fileSize && (
                                      <p className="text-xs text-white/70 mt-0.5">
                                        {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    )}
                                  </div>
                                  <a
                                    href={mediaUrl}
                                    download
                                    className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
                                  >
                                    <Download className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            {/* DOCX and other files - Show download card */}
                            {!isImage && !isPDF && !isVideo && (
                              <a
                                href={mediaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 p-5 hover:bg-[#043658]/5 transition-all group"
                              >
                                <div className="flex-shrink-0 text-5xl group-hover:scale-110 transition-transform">
                                  {getFileIcon(attachment.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-[#043658] truncate group-hover:text-[#FFC107] transition-colors">
                                    {attachment.fileName || "Document"}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1">
                                    {attachment.fileSize
                                      ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`
                                      : attachment.type}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="p-3 rounded-xl bg-[#043658]/10 group-hover:bg-[#FFC107] group-hover:text-white text-[#043658] transition-all">
                                    <Download className="h-5 w-5" />
                                  </div>
                                </div>
                              </a>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Image Lightbox Modal */}
                <AnimatePresence>
                  {lightboxImage && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
                      onClick={() => setLightboxImage(null)}
                    >
                      {/* Close button */}
                      <button
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-4 right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                      >
                        <X className="h-6 w-6" />
                      </button>

                      {/* Download button */}
                      <a
                        href={lightboxImage}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 right-20 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition-all"
                      >
                        <Download className="h-6 w-6" />
                      </a>

                      {/* Image */}
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="relative flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={lightboxImage}
                          alt="Full size preview"
                          className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions with Brand Colors */}
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-white via-[#043658]/[0.02] to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleLike}
                        disabled={likeMutation.isPending}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                          post.liked
                            ? "text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-lg shadow-red-500/30"
                            : "text-slate-600 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50"
                        }`}
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={post.liked ? "currentColor" : "none"}
                        />
                        <span className="text-sm">{likesCount}</span>
                      </motion.button>

                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 bg-white border border-slate-200 hover:border-[#043658] hover:bg-[#043658]/5 transition-all font-semibold"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">{commentsCount}</span>
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBookmark}
                        disabled={bookmarkMutation.isPending}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-semibold ${
                          post.bookmarked
                            ? "text-white bg-gradient-to-r from-[#043658] to-[#043658]/80 shadow-lg shadow-[#043658]/30"
                            : "text-slate-600 bg-white border border-slate-200 hover:border-[#FFC107] hover:bg-[#FFC107]/10"
                        }`}
                      >
                        <Bookmark
                          className="h-4 w-4"
                          fill={post.bookmarked ? "currentColor" : "none"}
                        />
                        <span className="text-sm">
                          {post.bookmarked ? "Saved" : "Save"}
                        </span>
                      </motion.button>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleShare}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-600 bg-white border border-slate-200 hover:border-[#FFC107] hover:bg-[#FFC107]/10 transition-all font-semibold"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="text-sm">Share</span>
                    </motion.button>
                  </div>
                </div>

                {/* Comments Section with Enhanced Design */}
                <div className="p-6 bg-gradient-to-br from-white to-[#043658]/[0.02]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-[#043658] flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      Comments ({commentsCount})
                    </h3>
                  </div>

                  {/* Comment Input with Gradient */}
                  <div className="mb-6">
                    <div className="flex gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#043658] to-[#043658]/80 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                          {user?.firstName?.charAt(0) || "U"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder="Share your thoughts..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-[#043658]/10 text-sm focus:border-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 resize-none bg-white shadow-sm transition-all"
                        />
                        <div className="flex justify-end mt-3">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleComment}
                            disabled={!commentText.trim() || commentMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#043658] to-[#043658]/90 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-[#043658]/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            {commentMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Post Comment
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comments List with Animation */}
                  <div className="space-y-4">
                    {commentsLoading ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-[#043658] mx-auto" />
                      </div>
                    ) : comments.length === 0 ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-12 bg-gradient-to-br from-slate-50 to-[#043658]/5 rounded-2xl border border-dashed border-[#043658]/20"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#043658]/10 to-[#FFC107]/10 mx-auto mb-3">
                          <MessageCircle className="h-8 w-8 text-[#043658]/40" />
                        </div>
                        <p className="text-sm font-semibold text-[#043658]">
                          No comments yet
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Be the first to share your thoughts!
                        </p>
                      </motion.div>
                    ) : (
                      <AnimatePresence>
                        {comments.map((comment: any, idx: number) => (
                          <motion.div 
                            key={comment.id}
                            variants={commentVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ delay: idx * 0.05 }}
                            className="flex gap-3"
                          >
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#043658] to-[#043658]/80 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                              {comment.teacher?.firstName?.charAt(0) || "T"}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl px-4 py-3 border border-[#043658]/5 shadow-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-bold text-sm text-[#043658]">
                                    {comment.teacher
                                      ? `${comment.teacher.firstName} ${comment.teacher.lastName}`
                                      : "Teacher"}
                                  </span>
                                  <span className="text-xs text-slate-400">
                                    {formatDate(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-4">
              {/* Trending Topics with Gradient */}
              <motion.div 
                className="rounded-2xl border border-[#043658]/10 bg-gradient-to-br from-white to-[#FFC107]/5 p-5 shadow-lg"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#FFC107] to-amber-400 shadow-md">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-[#043658]">Trending Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TRENDING_TOPICS.map((topic, idx) => (
                    <motion.span
                      key={topic}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#043658]/10 to-[#043658]/5 text-[#043658] text-xs font-bold hover:from-[#043658] hover:to-[#043658]/90 hover:text-white cursor-pointer transition-all shadow-sm hover:shadow-md"
                    >
                      {topic}
                    </motion.span>
                  ))}
                </div>
              </motion.div>

              {/* Active Contributors with Gradient */}
              <motion.div 
                className="rounded-2xl border border-[#043658]/10 bg-gradient-to-br from-white to-[#043658]/5 p-5 shadow-lg"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#043658] to-[#043658]/80 shadow-md">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-[#043658]">Active Contributors</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Abeba Kebede", level: "LEVEL 3", badge: "yellow" },
                    { name: "Betelhem Alemu", level: "LEVEL 5", badge: "blue" },
                    { name: "Yonas Tadesse", level: "LEVEL 4", badge: "blue" },
                  ].map((contributor, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                      className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white to-slate-50 border border-[#043658]/5 hover:border-[#FFC107] hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#043658] to-[#043658]/80 flex items-center justify-center text-white text-xs font-bold shadow-md group-hover:scale-110 transition-transform">
                          {contributor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#043658]">
                            {contributor.name}
                          </p>
                          <p className="text-xs text-slate-500">Computer Science</p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-sm ${
                          contributor.badge === "yellow"
                            ? "bg-gradient-to-r from-[#FFC107] to-amber-400 text-white"
                            : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        }`}
                      >
                        {contributor.level}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 py-2.5 text-sm text-white font-bold bg-gradient-to-r from-[#043658] to-[#043658]/90 rounded-xl hover:shadow-lg hover:shadow-[#043658]/30 transition-all"
                >
                  View Leaderboard
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
