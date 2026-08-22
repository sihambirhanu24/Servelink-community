"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Flag, MoreHorizontal, SquarePen, Trash2, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { bookmarkPost, likePost, removeBookmark, unlikePost } from "@/services/community";
import { getPostComments } from "@/services/comment.service";
import { useCreateComment } from "@/hooks/useCreateComment";
import { ReportPostModal } from "./ReportPostModal";
import { useVerification } from "@/hooks/useVerification";
import { PostAuthor } from "./PostAuthor";
import { PostActions } from "./PostActions";
import { PostAttachment } from "./PostAttachment";
import { PostTags } from "./PostTags";

interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
  fileName?: string;
  fileSize?: number;
}

interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  level: string;
  verified?: boolean;
  profileImage?: string;
  profession?: string;
}

interface Community {
  name: string;
}

interface Category {
  name: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  views?: number;
  community?: Community;
  category?: Category;
  teacher?: Teacher;
  communityLikes?: Array<{ teacherId: string }>;
  comments?: Array<unknown>;
  attachments?: Attachment[];
  likesCount?: number;
  liked?: boolean;
  bookmarked?: boolean;
  bookmarks?: number;
  tags?: Array<{ name: string }>;
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  feedMode?: boolean;
  onToast?: (message: string) => void;
}

export default function PostCard({ post, onDelete, onToast, feedMode = false }: PostCardProps) {
  const { user } = useAuth();
  const { status } = useVerification();
  const isVerified = status?.verificationStatus === "APPROVED";
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
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => getPostComments(post.id),
    initialData: post.comments as unknown as any[],
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

  const isLongDescription = (post.description?.length ?? 0) > 220;
  const displayedDescription = expanded || !isLongDescription ? post.description : `${post.description.slice(0, 220)}...`;
  const views = post.views ?? 0;

  const handleProtectedAction = (action: () => void) => {
    if (!isVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-verification-modal"));
      }
      return;
    }
    action();
  };

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
          queryClient.setQueryData(["post-comments", post.id], (previous: unknown[] = []) => [createdComment, ...previous]);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "We could not post the comment right now.";
          setCommentError(message);
        },
      }
    );
  }

  const formatRelativeTime = (value?: string) => {
    if (!value) return "Just now";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Recently shared";
    const now = Date.now();
    const diffInMs = now - parsed.getTime();
    const minutes = Math.max(1, Math.round(diffInMs / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="p-4 sm:p-5">
        {/* Post Header */}
        <div className="relative flex w-full items-start justify-between gap-3">
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
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        router.push(`/community/post/edit/${post.id}`);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#043658]"
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
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
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

        {/* Post Content */}
        <div className="mt-4">
          <h2 className="text-lg font-bold text-[#043658] leading-tight">{post.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">
            {displayedDescription}
          </p>
          {isLongDescription && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-2 text-sm font-semibold text-[#043658] transition hover:text-[#032742]"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {/* Tags */}
        <PostTags category={post.category} community={post.community} tags={post.tags} />

        {/* Attachments */}
        <PostAttachment attachments={post.attachments ?? []} />
      </div>

      {/* Actions */}
      <PostActions
        likes={likes}
        liked={liked}
        comments={comments.length}
        bookmarked={bookmarked}
        bookmarkCount={bookmarkCount}
        views={views}
        isVerified={isVerified}
        onLike={handleLike}
        onComment={() => setShowComments((prev) => !prev)}
        onBookmark={handleBookmark}
        isLiking={likeMutation.isPending}
        isBookmarking={bookmarkMutation.isPending}
      />

      {/* Comments */}
      <div
        className={`overflow-hidden border-t border-slate-100 bg-slate-50/50 transition-all duration-300 ${
          showComments ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-3 p-4 sm:p-5">
          {commentsLoading ? (
            <p className="text-sm text-slate-500">Loading comments…</p>
          ) : comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-center text-sm text-slate-500">
              No comments yet. Start the conversation.
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment: { id: string; content: string; createdAt?: string; teacher?: { firstName?: string; lastName?: string; verified?: boolean; level?: string } }) => (
                <div key={comment.id} className="rounded-xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                      {comment.teacher?.firstName?.charAt(0) ?? "T"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-[#043658]">
                          {comment.teacher ? `${comment.teacher.firstName} ${comment.teacher.lastName}` : "Teacher"}
                        </p>
                        {comment.teacher?.verified && <BadgeCheck className="h-3.5 w-3.5 text-[#FFC107]" />}
                        <span className="text-xs text-slate-400">
                          {comment.teacher?.level ?? "Teacher"} • {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sticky bottom-0 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
            {commentError && <p className="mb-2 text-sm text-red-600">{commentError}</p>}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                {post.teacher?.firstName?.charAt(0) ?? "T"}
              </div>
              <input
                value={commentDraft}
                onChange={(event) => setCommentDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleProtectedAction(handleCommentSubmit);
                  }
                }}
                placeholder="Write a comment..."
                className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-[#043658] outline-none transition focus:border-[#043658]"
              />
              <button
                type="button"
                onClick={() => handleProtectedAction(handleCommentSubmit)}
                disabled={createCommentMutation.isPending || !commentDraft.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#043658] text-white transition hover:bg-[#032742] disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send comment"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Modal */}
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
