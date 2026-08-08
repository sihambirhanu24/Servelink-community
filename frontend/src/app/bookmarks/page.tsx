"use client";

import { memo, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Bookmark,
  BookmarkX,
  Calendar,
  Heart,
  MessageCircle,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getMediaUrl } from "@/lib/media";
import { getBookmarks, removeBookmark } from "@/services/community";
import { toast } from "sonner";

interface BookmarkedPost {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  savedAt?: string;
  community?: { id?: string; name: string; type?: string };
  category?: { id?: string; name: string };
  teacher?: {
    id?: string;
    firstName: string;
    lastName: string;
    level?: string;
    verified?: boolean;
    profileImage?: string;
  };
  communityLikes?: Array<{ teacherId: string }>;
  likesCount?: number;
  comments?: Array<unknown>;
  commentsCount?: number;
  attachments?: Array<{
    id: string;
    url: string;
    type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
    fileName?: string;
  }>;
  /* Some APIs wrap the post inside a bookmark object */
  post?: BookmarkedPost;
}

type SortKey = "newest" | "oldest";

/* ─── Helpers ────────────────────────────────────────── */
function formatDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function relativeTime(value?: string) {
  if (!value) return "";
  const ms = Date.now() - new Date(value).getTime();
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

/** Data is already normalised in getBookmarks service, pass through */
function normalise(raw: BookmarkedPost): BookmarkedPost {
  return raw;
}

/* ─── Skeleton ───────────────────────────────────────── */
function BookmarkSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3 w-14 rounded bg-slate-100" />
        <div className="h-3 w-14 rounded bg-slate-100" />
      </div>
    </div>
  );
}

/* ─── Bookmark Card ──────────────────────────────────── */
const BookmarkCard = memo(function BookmarkCard({
  post,
  onRemove,
  isRemoving,
}: {
  post: BookmarkedPost;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const router = useRouter();
  const images = (post.attachments ?? []).filter((a) => a.type === "IMAGE");
  const thumbnail = images[0];
  const likes = post.communityLikes?.length ?? post.likesCount ?? 0;
  const commentCount = post.comments?.length ?? post.commentsCount ?? 0;
  const initials = post.teacher
    ? `${post.teacher.firstName[0]}${post.teacher.lastName[0]}`
    : "T";

  return (
    <article
      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#043658]/20 hover:shadow-md"
    >
      {/* Thumbnail strip */}
      {thumbnail && (
        <div className="h-36 w-full overflow-hidden bg-slate-100">
          <img
            src={getMediaUrl(thumbnail.url)}
            alt={post.title}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        </div>
      )}

      <div className="p-5">
        {/* Teacher row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-[#043658]">
                  {post.teacher
                    ? `${post.teacher.firstName} ${post.teacher.lastName}`
                    : "Teacher"}
                </span>
                {post.teacher?.verified && (
                  <BadgeCheck className="h-3.5 w-3.5 text-[#FFC107]" />
                )}
              </div>
              <p className="text-xs text-slate-400">
                {post.teacher?.level ?? "Teacher"}
                {post.community?.name && (
                  <> · <span className="text-[#043658]/70">{post.community.name}</span></>
                )}
              </p>
            </div>
          </div>

          {/* Remove bookmark button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(post.id); }}
            disabled={isRemoving}
            title="Remove bookmark"
            className="rounded-full p-1.5 text-[#043658] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <Bookmark className="h-4 w-4" fill="currentColor" />
          </button>
        </div>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
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
        </div>

        {/* Title + preview */}
        <h3 className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-[#043658] group-hover:text-[#032742]">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500">
          {post.description}
        </p>

        {/* Meta */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount}
            </span>
            {post.createdAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.createdAt)}
              </span>
            )}
          </div>

          {/* Open post link */}
          <Link
            href={`/community/post/${post.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full bg-[#043658] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#032742]"
          >
            Open
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
});

/* ─── Empty state ────────────────────────────────────── */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center rounded-[24px] border border-dashed border-slate-200 bg-white px-8 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#043658]/8">
        <Bookmark className="h-7 w-7 text-[#043658]/30" />
      </div>
      {hasFilters ? (
        <>
          <p className="mt-5 text-base font-semibold text-[#043658]">No saved posts match your search</p>
          <p className="mt-1 text-sm text-slate-400">Try a different keyword or clear the filters.</p>
        </>
      ) : (
        <>
          <p className="mt-5 text-base font-semibold text-[#043658]">Your saved posts will appear here</p>
          <p className="mt-1 text-sm text-slate-400">Bookmark any post to save it for later.</p>
          <Link
            href="/posts"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#032742]"
          >
            Browse Posts
          </Link>
        </>
      )}
    </div>
  );
}

/* ─── Stat pill ──────────────────────────────────────── */
function StatPill({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
      <p className="font-['Lexend'] text-2xl font-bold text-white">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-white/70">{label}</p>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [removingId, setRemovingId] = useState<string | null>(null);

  /* ── Data ── */
  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks"],
    queryFn: getBookmarks,
    staleTime: 30_000,
  });

  const rawBookmarks = useMemo(
    () => ((bookmarksQuery.data ?? []) as BookmarkedPost[]).map(normalise),
    [bookmarksQuery.data]
  );

  /* ── Stats ── */
  const totalSaved = rawBookmarks.length;
  const categories = useMemo(() => {
    const set = new Set(rawBookmarks.map((p) => p.category?.name).filter(Boolean));
    return set.size;
  }, [rawBookmarks]);
  const recentlySaved = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return rawBookmarks.filter((p) => {
      const ts = (p as any).savedAt ?? p.createdAt;
      return ts && new Date(ts).getTime() > cutoff;
    }).length;
  }, [rawBookmarks]);

  /* ── Communities for filter ── */
  const communityOptions = useMemo(() => {
    const map = new Map<string, string>();
    rawBookmarks.forEach((p) => { if (p.community?.name) map.set(p.community.name, p.community.name); });
    return Array.from(map.entries());
  }, [rawBookmarks]);

  /* ── Filtered & sorted list ── */
  const posts = useMemo(() => {
    let list = rawBookmarks;
    if (communityFilter !== "all") {
      list = list.filter((p) => p.community?.name === communityFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        `${p.title} ${p.description} ${p.teacher?.firstName} ${p.teacher?.lastName} ${p.community?.name}`
          .toLowerCase()
          .includes(q)
      );
    }
    return [...list].sort((a, b) => {
      // Prefer savedAt (bookmark date) over createdAt (post date)
      const aMs = new Date((a as any).savedAt ?? a.createdAt ?? 0).getTime();
      const bMs = new Date((b as any).savedAt ?? b.createdAt ?? 0).getTime();
      return sort === "oldest" ? aMs - bMs : bMs - aMs;
    });
  }, [rawBookmarks, search, communityFilter, sort]);

  /* ── Remove bookmark ── */
  const removeMutation = useMutation({
    mutationFn: (id: string) => removeBookmark(id),
    onMutate: (id) => setRemovingId(id),
    onSuccess: (_data, id) => {
      // Optimistic removal from cache
      queryClient.setQueryData(["bookmarks"], (prev: BookmarkedPost[] | undefined) =>
        (prev ?? []).filter((b) => b.id !== id)
      );
      // Then refetch to sync
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setRemovingId(null);
      toast.success("Bookmark removed.");
    },
    onError: () => {
      setRemovingId(null);
      toast.error("Could not remove bookmark. Try again.");
    },
  });


  const hasFilters = search.trim().length > 0 || communityFilter !== "all";

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-10">

          {/* ── Hero — matches CommunityHero / Posts page style ── */}
          <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#043658_0%,#0A4A74_100%)] p-6 shadow-[0_20px_45px_-24px_rgba(4,54,88,0.75)] sm:p-10">
            <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
            <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full border border-[#FFC107]/10" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFC107]">
                  Saved Content
                </p>
                <h1 className="mt-3 font-['Lexend'] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Bookmarks
                </h1>
                <p className="mt-3 max-w-xl text-base leading-7 text-white/75">
                  Your saved educational resources and discussions — all in one place.
                </p>

                {/* Stat pills */}
                {!bookmarksQuery.isLoading && (
                  <div className="mt-6 flex flex-wrap gap-3">
                    <StatPill value={totalSaved} label="Saved Posts" />
                    <StatPill value={categories} label="Categories" />
                    <StatPill value={recentlySaved} label="Saved This Week" />
                  </div>
                )}
              </div>

              {/* Illustration accent */}
              <div className="hidden xl:flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <Bookmark className="h-9 w-9 text-[#FFC107]" fill="currentColor" />
              </div>
            </div>
          </section>

          {/* ── Filter bar ── */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Search */}
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search saved posts…"
                  className="w-full rounded-2xl border border-slate-200 bg-[#F7F9FC] py-3 pl-11 pr-4 text-sm text-[#043658] outline-none transition focus:border-[#043658]"
                />
              </label>

              {/* Community filter */}
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                <BookmarkX className="h-4 w-4 text-[#043658]" />
                <select
                  value={communityFilter}
                  onChange={(e) => setCommunityFilter(e.target.value)}
                  className="bg-transparent outline-none"
                >
                  <option value="all">All Communities</option>
                  {communityOptions.map(([name]) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>

              {/* Sort */}
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                <SlidersHorizontal className="h-4 w-4 text-[#043658]" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-transparent outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>

              {/* Clear */}
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setCommunityFilter("all"); }}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-500 transition hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </section>

          {/* Results count */}
          {!bookmarksQuery.isLoading && !bookmarksQuery.isError && posts.length > 0 && (
            <p className="mt-4 text-xs text-slate-400">
              {posts.length} {posts.length === 1 ? "bookmark" : "bookmarks"}
              {hasFilters ? " match your search" : " saved"}
            </p>
          )}

          {/* ── Grid ── */}
          <section className="mt-5">
            {bookmarksQuery.isError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-10 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-red-400" />
                <p className="mt-3 font-semibold text-red-700">Could not load your bookmarks.</p>
                <button
                  type="button"
                  onClick={() => bookmarksQuery.refetch()}
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </button>
              </div>
            ) : bookmarksQuery.isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <BookmarkSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {posts.length === 0 ? (
                  <EmptyState hasFilters={hasFilters} />
                ) : (
                  posts.map((post) => (
                    <BookmarkCard
                      key={post.id}
                      post={post}
                      onRemove={(id) => removeMutation.mutate(id)}
                      isRemoving={removingId === post.id}
                    />
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
