"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BadgeCheck,
  Bookmark,
  Eye,
  FileImage,
  FileText,
  Flag,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  SquarePen,
  Trash2,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { bookmarkPost, likePost, removeBookmark, unlikePost } from "@/services/community";
import { getMediaUrl } from "@/lib/media";
import { getPostComments } from "@/services/comment.service";
import { useCreateComment } from "@/hooks/useCreateComment";
import { ReportPostModal } from "./ReportPostModal";

interface Props {
  post: {
    id: string;
    title: string;
    description: string;
    createdAt?: string;
    views?: number;
    community?: {
      name: string;
    };
    category?: {
      name: string;
    };
    teacher?: {
      id?: string;
      firstName: string;
      lastName: string;
      level: string;
      verified?: boolean;
      profileImage?: string;
    };
    communityLikes?: Array<{ teacherId: string }>;
    comments?: Array<unknown>;
    attachments?: Array<{
      id: string;
      url: string;
      type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
      fileName?: string;
      fileSize?: number;
    }>;
    likesCount?: number;
    liked?: boolean;
    bookmarked?: boolean;
    bookmarks?: number;
  };
  onDelete?: (id: string) => void;
  /** @deprecated Pass onDelete instead; ownership is auto-detected via useAuth */
  showActions?: boolean;
  onToast?: (message: string) => void;
  /**
   * feedMode — when true this card is rendered inside a public feed.
   * Owner management actions (View/Edit/Delete) are hidden;
   * the three-dot menu shows only "Report Post" for every user.
   */
  feedMode?: boolean;
}

export default function PostCard({ post, onDelete, onToast, feedMode = false }: Props) {
  const { user } = useAuth();
  // Auto-derive ownership — suppressed in feedMode (public feeds never show management actions)
  const isOwner = !feedMode && !!user?.id && !!post.teacher?.id && user.id === post.teacher.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [likes, setLikes] = useState(post.likesCount ?? 0);
  const [liked, setLiked] = useState(post.liked ?? false);
  const [bookmarked, setBookmarked] = useState(post.bookmarked ?? false);
  const [bookmarkCount, setBookmarkCount] = useState(post.bookmarks ?? 0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareButtonRef, setShareButtonRef] = useState<HTMLButtonElement | null>(null);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => getPostComments(post.id),
    initialData: post.comments ?? [],
    enabled: showComments,
  });
  const createCommentMutation = useCreateComment();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["my-posts"] });
    queryClient.invalidateQueries({ queryKey: ["global-feed"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    queryClient.invalidateQueries({ queryKey: ["community-posts-search"] });
    queryClient.invalidateQueries({ queryKey: ["community-feed"] });
  };

  const likeMutation = useMutation({
    mutationFn: (isUnliking: boolean) => (isUnliking ? unlikePost(post.id) : likePost(post.id)),
    onSuccess: invalidateAll,
  });

  const bookmarkMutation = useMutation({
    mutationFn: (isRemoving: boolean) => (isRemoving ? removeBookmark(post.id) : bookmarkPost(post.id)),
    onSuccess: invalidateAll,
  });

  const imageAttachments = useMemo(() => (post.attachments ?? []).filter((attachment) => attachment.type === "IMAGE"), [post.attachments]);
  const documentAttachments = useMemo(() => (post.attachments ?? []).filter((attachment) => attachment.type !== "IMAGE"), [post.attachments]);
  const isLongDescription = (post.description?.length ?? 0) > 220;
  const displayedDescription = expanded || !isLongDescription ? post.description : `${post.description.slice(0, 220)}...`;
  const views = post.views ?? 0; // Use actual views from database

  async function handleLike() {
    if (likeMutation.isPending) return;
    try {
      if (liked) {
        await likeMutation.mutateAsync(true);
        setLikes((prev) => prev - 1);
        setLiked(false);
      } else {
        await likeMutation.mutateAsync(false);
        setLikes((prev) => prev + 1);
        setLiked(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not update the like state.";
      onToast?.(message);
    }
  }

  async function handleBookmark() {
    if (bookmarkMutation.isPending) return;
    try {
      if (bookmarked) {
        await bookmarkMutation.mutateAsync(true);
        setBookmarkCount((prev) => Math.max(0, prev - 1));
        setBookmarked(false);
      } else {
        await bookmarkMutation.mutateAsync(false);
        setBookmarkCount((prev) => prev + 1);
        setBookmarked(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not update the bookmark state.";
      onToast?.(message);
    }
  }

  function handleCommentSubmit() {
    const content = commentDraft.trim();
    if (!content || createCommentMutation.isPending) return;

    setCommentError(null);
    createCommentMutation.mutate(
      { postId: post.id, content },
      {
        onSuccess: (createdComment) => {
          setCommentDraft("");
          queryClient.setQueryData(["post-comments", post.id], (previous: any[] = []) => [createdComment, ...previous]);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "We could not post the comment right now.";
          setCommentError(message);
        },
      },
    );
  }

  function formatRelativeTime(value?: string) {
    if (!value) return "Just now";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Recently shared";
    }

    const diffInMs = Date.now() - parsed.getTime();
    const minutes = Math.max(1, Math.round(diffInMs / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  }

  function formatPostDate(value?: string) {
    if (!value) return "Today";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Recently shared";
    }

    return parsed.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <article className={`group overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_55px_-28px_rgba(4,54,88,0.25)] transition duration-300 ${!selectedImage ? 'hover:-translate-y-1 hover:shadow-[0_24px_65px_-24px_rgba(4,54,88,0.35)]' : ''}`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
              {post.teacher?.firstName?.charAt(0) ?? "T"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#043658]">
                  {post.teacher ? `${post.teacher.firstName} ${post.teacher.lastName}` : "Teacher"}
                </h3>
                {post.teacher?.verified ? <BadgeCheck className="h-4 w-4 text-[#FFC107]" /> : null}
              </div>
              <p className="text-sm text-slate-500">
                {post.teacher?.level ?? "Teacher"} · {formatPostDate(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#043658]"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <>
                <div className="fixed inset-0 z-[5]" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-10 min-w-[160px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                  {isOwner ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          router.push(`/community/edit/${post.id}`);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#043658]"
                      >
                        <SquarePen className="h-4 w-4" />
                        Edit Post
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete?.(post.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
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
                        setReportModalOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-amber-700 transition hover:bg-amber-50"
                    >
                      <Flag className="h-4 w-4" />
                      Report Post
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#043658]/10 px-3 py-1 text-xs font-semibold text-[#043658]">{post.community?.name}</span>
          <span className="rounded-full bg-[#FFC107]/20 px-3 py-1 text-xs font-semibold text-[#765900]">{post.category?.name}</span>
        </div>

        <h2 className="mt-4 text-xl font-semibold leading-7 text-[#043658] sm:text-2xl">{post.title}</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {displayedDescription}
        </p>
        {isLongDescription ? (
          <button type="button" onClick={() => setExpanded((prev) => !prev)} className="mt-2 text-sm font-semibold text-[#043658] transition hover:text-[#032742]">
            {expanded ? "Show less" : "Read more"}
          </button>
        ) : null}

        {post.attachments && post.attachments.length > 0 ? (
          <div className="mt-5">
            {imageAttachments.length > 0 ? (
              <div className={
                imageAttachments.length === 1 ? "grid grid-cols-1" :
                imageAttachments.length === 2 ? "grid grid-cols-2 gap-3" :
                imageAttachments.length === 3 ? "grid grid-cols-2 gap-3 [&>button:first-child]:col-span-2" :
                "grid grid-cols-2 gap-3"
              }>
                {imageAttachments.slice(0, 4).map((attachment, index) => {
                  const url = getMediaUrl(attachment.url);
                  const isLastVisible = index === 3;
                  const remainingCount = imageAttachments.length - 4;
                  
                  return (
                    <button key={attachment.id} type="button" onClick={() => setSelectedImage(url)} className="group relative block w-full overflow-hidden rounded-[24px] border border-slate-200 text-left bg-slate-50">
                      <img 
                        src={url} 
                        alt={attachment.fileName ?? post.title} 
                        onError={(e) => { 
                          console.error('Image failed to load:', url); 
                          e.currentTarget.src = 'https://placehold.co/600x400/043658/FFFFFF?text=ServeLink'; 
                        }} 
                        className="h-56 w-full object-cover transition duration-300 group-hover:scale-[1.02]" 
                      />
                      {isLastVisible && remainingCount > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-3xl font-semibold text-white transition group-hover:bg-black/40">
                          +{remainingCount}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {documentAttachments.length > 0 ? (
              <div className="mt-4 space-y-3">
                {documentAttachments.map((attachment) => {
                  const url = getMediaUrl(attachment.url);
                  const isPdf = attachment.type === "PDF";
                  const isDocx = attachment.type === "DOCX";
                  return (
                    <div key={attachment.id} className="flex flex-col gap-3 rounded-[20px] border border-slate-200 bg-[#F7F9FC] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isPdf ? "bg-red-100 text-red-600" : isDocx ? "bg-blue-100 text-blue-600" : "bg-[#043658]/10 text-[#043658]"}`}>
                          {isPdf ? <FileText className="h-5 w-5" /> : isDocx ? <FileImage className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#043658]">{attachment.fileName ?? attachment.type}</p>
                          <p className="text-xs text-slate-500">{attachment.fileSize ? `${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB` : "Attachment"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={url} target="_blank" rel="noreferrer" className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#043658] transition hover:bg-slate-50">
                          Open
                        </a>
                        <a href={url} download className="rounded-full border border-[#043658]/15 bg-[#043658]/5 px-3 py-2 text-sm font-semibold text-[#043658] transition hover:bg-[#043658]/10">
                          Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-slate-100 bg-[#FCFDFF] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <button 
            type="button" 
            onClick={handleLike} 
            disabled={likeMutation.isPending} 
            className={`flex items-center gap-2 transition disabled:cursor-not-allowed disabled:opacity-60 ${
              liked ? 'text-red-500' : 'hover:text-red-500'
            }`}
          >
            <Heart className="h-4 w-4" fill={liked ? "currentColor" : "none"} />
            <span>{likes}</span>
          </button>
          <button type="button" onClick={() => setShowComments((prev) => !prev)} className="flex items-center gap-2 transition hover:text-[#043658]">
            <MessageCircle className="h-4 w-4" />
            <span>{comments.length}</span>
          </button>
          <button type="button" onClick={handleBookmark} disabled={bookmarkMutation.isPending} className={`flex items-center gap-2 transition ${bookmarked ? "text-[#043658]" : "hover:text-[#043658]"} disabled:cursor-not-allowed disabled:opacity-60`}>
            <Bookmark className="h-4 w-4" fill={bookmarked ? "currentColor" : "none"} />
            <span>{bookmarkCount}</span>
          </button>
          <div className="relative">
            <button
              ref={setShareButtonRef}
              type="button"
              onClick={() => setShareOpen((prev) => !prev)}
              className="flex items-center gap-2 transition hover:text-[#043658]"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>

            {shareOpen && shareButtonRef && typeof window !== 'undefined' && createPortal(
              <>
                {/* Backdrop to close on outside click */}
                <div className="fixed inset-0 z-30" onClick={() => setShareOpen(false)} />
                <div 
                  className="fixed z-40 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                  style={{
                    top: `${shareButtonRef.getBoundingClientRect().top}px`,
                    left: `${shareButtonRef.getBoundingClientRect().left}px`,
                    transform: 'translateY(-100%) translateY(-8px)'
                  }}
                >
                  <p className="mb-2 px-3 pt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Share via</p>

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(post.title + " — " + window.location.origin + "/community/posts/" + post.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-green-50 hover:text-green-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-100 text-green-600 text-base">💬</span>
                    WhatsApp
                  </a>

                  {/* Telegram */}
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + "/community/posts/" + post.id)}&text=${encodeURIComponent(post.title)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-600 text-base">✈️</span>
                    Telegram
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.origin + "/community/posts/" + post.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-200 text-slate-800 font-bold text-sm">𝕏</span>
                    X / Twitter
                  </a>

                  {/* LinkedIn */}
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + "/community/posts/" + post.id)}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShareOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs">in</span>
                    LinkedIn
                  </a>

                  <div className="my-1 h-px bg-slate-100" />

                  {/* Copy Link */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(`${window.location.origin}/community/posts/${post.id}`);
                        onToast?.("Link copied to clipboard!");
                      } catch {
                        onToast?.("Could not copy link.");
                      }
                      setShareOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#043658]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100">
                      <LinkIcon className="h-3.5 w-3.5 text-slate-600" />
                    </span>
                    Copy Link
                  </button>
                </div>
              </>,
              document.body
            )}
          </div>
          <span className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span>{views}</span>
          </span>
        </div>

          {isOwner && (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => router.push(`/community/post/${post.id}`)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#043658] transition hover:-translate-y-0.5 hover:border-[#043658]/30 hover:bg-[#043658]/5">
              <Eye className="h-4 w-4" />
              View
            </button>
            <button type="button" onClick={() => router.push(`/community/edit/${post.id}`)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#FFC107]/50 bg-[#FFC107]/10 px-4 py-2.5 text-sm font-semibold text-[#765900] transition hover:-translate-y-0.5 hover:bg-[#FFC107]/20">
              <SquarePen className="h-4 w-4" />
              Edit
            </button>
            <button type="button" onClick={() => onDelete?.(post.id)} className="flex flex-1 items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={`overflow-hidden border-t border-slate-100 bg-white transition-all duration-300 ${showComments ? "max-h-[1600px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="space-y-3 p-5 sm:p-6">
          {commentsLoading ? (
            <p className="text-sm text-slate-500">Loading comments…</p>
          ) : comments.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-[#F7F9FC] p-4 text-sm text-slate-500">
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="rounded-[20px] border border-slate-100 bg-[#F7F9FC] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                    {comment.teacher?.firstName?.charAt(0) ?? "T"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#043658]">
                        {comment.teacher ? `${comment.teacher.firstName} ${comment.teacher.lastName}` : "Teacher"}
                      </p>
                      {comment.teacher?.verified ? <BadgeCheck className="h-4 w-4 text-[#FFC107]" /> : null}
                      <span className="text-xs text-slate-500">
                        {comment.teacher?.level ?? "Teacher"} • {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{comment.content}</p>
                  </div>
                </div>
              </div>
            ))
          )}

          <div className="sticky bottom-0 rounded-[20px] border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            {commentError ? <p className="mb-2 text-sm text-red-600">{commentError}</p> : null}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                {post.teacher?.firstName?.charAt(0) ?? "T"}
              </div>
              <input
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleCommentSubmit();
                  }
                }}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-full border border-slate-200 bg-[#F7F9FC] px-4 py-2.5 text-sm text-[#043658] outline-none transition focus:border-[#043658]"
              />
              <button
                type="button"
                onClick={handleCommentSubmit}
                disabled={createCommentMutation.isPending || !commentDraft.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#043658] text-white transition hover:bg-[#032742] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedImage ? (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" 
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[24px] bg-white p-2" 
            onClick={(event) => event.stopPropagation()}
          >
            <button 
              type="button" 
              onClick={() => setSelectedImage(null)} 
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-[#043658] shadow-lg hover:bg-white transition-colors"
            >
              Close
            </button>
            <img 
              src={selectedImage} 
              alt="Preview" 
              className="max-h-[85vh] w-full object-contain" 
            />
          </div>
        </div>
      ) : null}

      <ReportPostModal
        postId={post.id}
        postTitle={post.title}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={() => {
          onToast?.("Post reported. Our team will review it shortly.");
          setReportModalOpen(false);
        }}
      />
    </article>
  );
}