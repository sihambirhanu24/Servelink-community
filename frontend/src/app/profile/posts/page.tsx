"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  Heart,
  Loader2,
  MessageCircle,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import DeleteModal from "@/components/post/DeleteModal";
import { getMyPosts } from "@/services/profile";
import { deletePost } from "@/services/community";
import { getMediaUrl } from "@/lib/media";

/* ─── Types ─────────────────────────────────────────── */
interface Attachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
  fileName?: string;
  fileSize?: number;
}

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  visibility?: string;
  community?: { id?: string; name: string };
  category?: { id?: string; name: string };
  teacher?: {
    id?: string;
    firstName: string;
    lastName: string;
    level: string;
    verified?: boolean;
    profileImage?: string;
  };
  communityLikes?: Array<{ teacherId: string }>;
  likesCount?: number;
  comments?: Array<unknown>;
  attachments?: Attachment[];
  liked?: boolean;
  bookmarked?: boolean;
  bookmarks?: number;
}

/* ─── Helpers ────────────────────────────────────────── */
function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fileIcon(type: Attachment["type"]) {
  if (type === "PDF") return { emoji: "📄", color: "bg-red-100 text-red-700" };
  if (type === "DOCX") return { emoji: "📝", color: "bg-blue-100 text-blue-700" };
  if (type === "VIDEO") return { emoji: "🎬", color: "bg-purple-100 text-purple-700" };
  return { emoji: "🖼", color: "bg-emerald-100 text-emerald-700" };
}

/* ─── Post Row Card ──────────────────────────────────── */
function PostRowCard({
  post,
  onDelete,
  onToast,
}: {
  post: Post;
  onDelete: (id: string) => void;
  onToast: (msg: string) => void;
}) {
  const router = useRouter();
  const [imgError, setImgError] = useState(false);

  const likes = post.communityLikes?.length ?? post.likesCount ?? 0;
  const commentCount = post.comments?.length ?? 0;
  const images = (post.attachments ?? []).filter((a) => a.type === "IMAGE");
  const docs = (post.attachments ?? []).filter((a) => a.type !== "IMAGE");
  const firstImage = images[0];
  const extraImages = images.length > 1 ? images.length - 1 : 0;

  const visibility = post.visibility ?? "PUBLIC";
  const visibilityColor =
    visibility === "PUBLIC"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <article className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#043658]/20 hover:shadow-md">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">

        {/* ── Thumbnail ── */}
        {firstImage && !imgError ? (
          <div className="relative shrink-0">
            <img
              src={getMediaUrl(firstImage.url)}
              alt={post.title}
              onError={() => setImgError(true)}
              className="h-28 w-28 rounded-2xl object-cover sm:h-32 sm:w-32"
            />
            {extraImages > 0 && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 text-sm font-bold text-white">
                +{extraImages}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#043658]/5 sm:h-32 sm:w-32">
            <FileText className="h-8 w-8 text-[#043658]/30" />
          </div>
        )}

        {/* ── Content ── */}
        <div className="min-w-0 flex-1">
          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2">
            {post.community?.name && (
              <span className="rounded-full bg-[#043658]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#043658]">
                {post.community.name}
              </span>
            )}
            {post.category?.name && (
              <span className="rounded-full bg-[#FFC107]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#765900]">
                {post.category.name}
              </span>
            )}
            <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${visibilityColor}`}>
              {visibility}
            </span>
          </div>

          {/* Title */}
          <h2 className="mt-2 truncate text-base font-semibold text-[#043658] group-hover:text-[#032742]">
            {post.title}
          </h2>

          {/* Description */}
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {post.description}
          </p>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(post.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              {likes} {likes === 1 ? "like" : "likes"}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
            {docs.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                {docs.length} {docs.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>

          {/* File chips */}
          {docs.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {docs.map((doc) => {
                const { emoji, color } = fileIcon(doc.type);
                return (
                  <a
                    key={doc.id}
                    href={getMediaUrl(doc.url)}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition hover:opacity-80 ${color} border-current/20`}
                  >
                    <span>{emoji}</span>
                    {doc.fileName ?? doc.type}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Link
            href={`/posts/${post.id}`}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-[#043658]/30 hover:bg-[#043658]/5 hover:text-[#043658]"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/community/edit/${post.id}`)}
            className="flex items-center gap-1.5 rounded-xl border border-[#FFC107]/40 bg-[#FFC107]/10 px-3 py-2 text-xs font-semibold text-[#765900] transition hover:bg-[#FFC107]/20"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Skeleton ───────────────────────────────────────── */
function PostSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-6">
        <div className="h-32 w-32 shrink-0 rounded-2xl bg-slate-200" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-5 w-24 rounded-full bg-slate-200" />
            <div className="h-5 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="h-4 w-full rounded bg-slate-100" />
          <div className="h-4 w-2/3 rounded bg-slate-100" />
          <div className="flex gap-4 pt-1">
            <div className="h-3 w-16 rounded bg-slate-100" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────── */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-[28px] border border-dashed border-slate-200 bg-white px-8 py-20 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#043658]/8 text-[#043658]">
        {hasFilters ? <Search className="h-7 w-7" /> : <BookOpen className="h-7 w-7" />}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-[#043658]">
        {hasFilters ? "No posts match your filters" : "You haven't published anything yet"}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        {hasFilters
          ? "Try clearing the search or adjusting the filters."
          : "Start a discussion, share a resource, or post a classroom update to get started."}
      </p>
      {!hasFilters && (
        <Link
          href="/posts"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#043658] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#032742]"
        >
          <Plus className="h-4 w-4" />
          Create Your First Post
        </Link>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function ProfilePostsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest" | "most-likes">("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Data ── */
  const postsQuery = useQuery<Post[]>({
    queryKey: ["my-posts"],
    queryFn: getMyPosts,
  });

  const posts: Post[] = useMemo(() => {
    const raw = (postsQuery.data ?? []) as Post[];

    const filtered = raw.filter((p) => {
      if (!search.trim()) return true;
      const haystack = `${p.title} ${p.description} ${p.community?.name ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });

    return [...filtered].sort((a, b) => {
      if (sort === "most-likes") {
        return (b.communityLikes?.length ?? b.likesCount ?? 0) - (a.communityLikes?.length ?? a.likesCount ?? 0);
      }
      const aMs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bMs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === "oldest" ? aMs - bMs : bMs - aMs;
    });
  }, [postsQuery.data, search, sort]);

  /* ── Delete ── */
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: (_data, id) => {
      // Optimistically remove from cache immediately
      queryClient.setQueryData(["my-posts"], (prev: Post[] | undefined) =>
        (prev ?? []).filter((p) => p.id !== id)
      );
      // Refresh all related feeds so counts update everywhere
      queryClient.invalidateQueries({ queryKey: ["my-posts"] });
      queryClient.invalidateQueries({ queryKey: ["global-feed"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      setDeleteId(null);
      showToast("Post deleted successfully.");
    },
    onError: (err) => {
      showToast(err instanceof Error ? err.message : "Could not delete the post. Try again.");
    },
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  const hasFilters = search.trim().length > 0;

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-10">

          {/* ── Compact page header — matches Notifications / Posts pages ── */}
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-[#043658]"
              >
                <ArrowLeft className="h-3 w-3" />
                Profile
              </Link>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#926E00]">
                My Content
              </p>
              <h1 className="mt-1 font-['Lexend'] text-3xl font-semibold text-[#043658]">
                My Posts
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                All posts you've published. Manage, edit, or remove them at any time.
              </p>
            </div>

            {/* Stats + CTA row */}
            <div className="flex items-center gap-3">
              {!postsQuery.isLoading && (
                <>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                    <p className="font-['Lexend'] text-xl font-bold text-[#043658]">
                      {(postsQuery.data as Post[] | undefined)?.length ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400">Posts</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                    <p className="font-['Lexend'] text-xl font-bold text-[#043658]">
                      {(postsQuery.data as Post[] | undefined)?.reduce(
                        (s, p) => s + (p.communityLikes?.length ?? p.likesCount ?? 0), 0
                      ) ?? 0}
                    </p>
                    <p className="text-[11px] text-slate-400">Likes</p>
                  </div>
                </>
              )}
              <Link
                href="/posts"
                className="inline-flex items-center gap-2 rounded-full bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#032742]"
              >
                <Plus className="h-4 w-4" />
                New Post
              </Link>
            </div>
          </header>

          {/* ── Filters — same card style as posts & community pages ── */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search title, description, community…"
                  className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FC] py-3 pl-11 pr-4 text-sm text-[#043658] outline-none transition focus:border-[#043658]"
                />
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                <Filter className="h-4 w-4 text-[#043658]" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                  className="bg-transparent outline-none"
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="most-likes">Most liked</option>
                </select>
              </label>
            </div>
          </section>

          {/* ── List ── */}
          <section className="mt-5 space-y-4">
            {postsQuery.isError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
                <p className="mt-3 font-semibold text-red-700">Could not load your posts.</p>
                <button
                  type="button"
                  onClick={() => postsQuery.refetch()}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : postsQuery.isLoading ? (
              <>
                <PostSkeleton />
                <PostSkeleton />
                <PostSkeleton />
              </>
            ) : posts.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              posts.map((post) => (
                <PostRowCard
                  key={post.id}
                  post={post}
                  onDelete={(id) => setDeleteId(id)}
                  onToast={showToast}
                />
              ))
            )}
          </section>
        </div>
      </main>

      {/* ── Delete Modal ── */}
      <DeleteModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onDelete={() => { if (deleteId) deleteMutation.mutate(deleteId); }}
        isDeleting={deleteMutation.isPending}
      />

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-[#043658]/10 bg-[#043658] px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
