"use client";

import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowUpRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";

import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import PostCard from "@/components/post/PostCard";
import { useAuth } from "@/context/AuthContext";
import { getCategories, getCommunities, getPosts } from "@/services/community";

/* ─── Types ─────────────────────────────────────────── */
interface Post {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
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
  attachments?: Array<{
    id: string;
    url: string;
    type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
    fileName?: string;
    fileSize?: number;
  }>;
  liked?: boolean;
  bookmarked?: boolean;
  bookmarks?: number;
}

type SortKey = "newest" | "oldest" | "most-likes" | "most-comments";

/* ─── Skeleton ───────────────────────────────────────── */
const PostSkeleton = memo(function PostSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="h-12 w-12 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="mt-5 h-36 w-full rounded-2xl bg-slate-100" />
    </div>
  );
});

/* ─── Empty state ────────────────────────────────────── */
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center rounded-[24px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
        <Search className="h-7 w-7 text-slate-300" />
        <p className="mt-3 text-base font-semibold text-[#043658]">No posts match your filters</p>
        <p className="mt-1 text-sm text-slate-400">Try a different keyword or clear a filter.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center rounded-[24px] border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
      <p className="mt-3 text-base font-semibold text-[#043658]">No posts available yet</p>
      <p className="mt-1 text-sm text-slate-400">
        Be the first to start a discussion in your community.
      </p>
      <Link
        href="/community/create"
        className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#032742]"
      >
        Create a Post
      </Link>
    </div>
  );
}

const MemoPostCard = memo(PostCard);

/* ─── Page ───────────────────────────────────────────── */
export default function GlobalFeedPage() {
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [communityId, setCommunityId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  /* ── Data fetching ── */
  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: getCommunities,
    staleTime: 60_000,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    staleTime: 60_000,
  });

  const postsQuery = useQuery({
    queryKey: ["global-feed", communityId, categoryId],
    queryFn: () =>
      getPosts({
        communityId: communityId !== "all" ? communityId : undefined,
        categoryId: categoryId !== "all" ? categoryId : undefined,
        page: 1,
        limit: 50,
      }),
    staleTime: 30_000,
  });

  /* ── Derived ── */
  const communities = useMemo(
    () => (communitiesQuery.data ?? []) as Array<{ id: string; name: string }>,
    [communitiesQuery.data]
  );
  const categories = useMemo(
    () => (categoriesQuery.data ?? []) as Array<{ id: string; name: string }>,
    [categoriesQuery.data]
  );

  const selectedCommunityName = communities.find((c) => c.id === communityId)?.name ?? null;
  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.name ?? null;

  const posts = useMemo(() => {
    const raw = (postsQuery.data ?? []) as Post[];
    const searched =
      search.trim().length === 0
        ? raw
        : raw.filter((p) => {
            const hay =
              `${p.title} ${p.description} ${p.teacher?.firstName} ${p.teacher?.lastName}`.toLowerCase();
            return hay.includes(search.toLowerCase());
          });
    return [...searched].sort((a, b) => {
      if (sort === "most-likes")
        return (
          (b.communityLikes?.length ?? b.likesCount ?? 0) -
          (a.communityLikes?.length ?? a.likesCount ?? 0)
        );
      if (sort === "most-comments")
        return (b.comments?.length ?? 0) - (a.comments?.length ?? 0);
      const aMs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bMs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === "oldest" ? aMs - bMs : bMs - aMs;
    });
  }, [postsQuery.data, search, sort]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function clearFilters() {
    setSearch("");
    setCommunityId("all");
    setCategoryId("all");
    setSort("newest");
  }

  const hasFilters =
    search.trim().length > 0 || communityId !== "all" || categoryId !== "all";

  const activeCount = [
    search.trim().length > 0,
    communityId !== "all",
    categoryId !== "all",
  ].filter(Boolean).length;

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8 lg:px-10">

          {/* ── Hero — matches CommunityHero style ── */}
          <section className="relative mb-6 overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#043658_0%,#0A4A74_100%)] p-6 shadow-[0_20px_45px_-24px_rgba(4,54,88,0.75)] sm:p-10">
            {/* Decorative circles */}
            <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
            <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full border border-[#FFC107]/10" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFC107]">
                  Community Feed
                </p>
                <h1 className="mt-3 font-['Lexend'] text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  Posts
                </h1>
                <p className="mt-3 text-base leading-7 text-white/75">
                  Discover educational discussions from teachers across Ethiopia.
                </p>

                {/* Search bar inside hero */}
                <div className="mt-6 flex max-w-lg gap-3">
                  <label className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search posts, teachers, topics…"
                      className="w-full rounded-2xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder-white/50 outline-none backdrop-blur-sm transition focus:border-white/40 focus:bg-white/15"
                    />
                  </label>
                </div>
              </div>

              {/* CTA */}
              <Link
                href="/community/create"
                className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#FFC107] px-6 py-4 text-sm font-bold text-[#043658] shadow-[0_12px_24px_-12px_rgba(255,193,7,0.8)] transition duration-200 hover:-translate-y-1 hover:bg-[#ffd04a]"
              >
                <Plus className="h-5 w-5" />
                Create Post
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </section>

          {/* ── Filter bar ── */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex gap-3">
              {/* Filter toggle */}
              <button
                type="button"
                onClick={() => setShowFilters((p) => !p)}
                className={`relative flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition
                  ${showFilters || activeCount > 0
                    ? "border-[#043658]/30 bg-[#043658]/5 text-[#043658]"
                    : "border-slate-200 bg-[#F7F9FC] text-slate-600 hover:border-[#043658]/20"
                  }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filter</span>
                {activeCount > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#043658] text-[10px] font-bold text-white">
                    {activeCount}
                  </span>
                )}
              </button>

              {/* Sort — always visible */}
              <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-2.5 text-sm text-slate-600">
                <SlidersHorizontal className="h-4 w-4 text-[#043658]" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-transparent outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="most-likes">Most Liked</option>
                  <option value="most-comments">Most Commented</option>
                </select>
              </label>
            </div>

            {/* Expanded dropdowns */}
            {showFilters && (
              <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 lg:flex-row lg:items-center">
                <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                  <Filter className="h-4 w-4 text-[#043658]" />
                  <select
                    value={communityId}
                    onChange={(e) => setCommunityId(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  >
                    <option value="all">All Communities</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-[#F7F9FC] px-3 py-3 text-sm text-slate-600">
                  <Filter className="h-4 w-4 text-[#043658]" />
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="flex-1 bg-transparent outline-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {/* Active filter pills */}
            {hasFilters && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs text-slate-400">Active:</span>
                {search.trim() && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043658]/10 px-3 py-1 text-xs font-semibold text-[#043658]">
                    &ldquo;{search}&rdquo;
                    <button type="button" onClick={() => setSearch("")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {communityId !== "all" && selectedCommunityName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043658]/10 px-3 py-1 text-xs font-semibold text-[#043658]">
                    {selectedCommunityName}
                    <button type="button" onClick={() => setCommunityId("all")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {categoryId !== "all" && selectedCategoryName && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043658]/10 px-3 py-1 text-xs font-semibold text-[#043658]">
                    {selectedCategoryName}
                    <button type="button" onClick={() => setCategoryId("all")}><X className="h-3 w-3" /></button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto text-xs font-medium text-slate-400 transition hover:text-red-500"
                >
                  Clear all
                </button>
              </div>
            )}
          </section>

          {/* ── Results count ── */}
          {!postsQuery.isLoading && !postsQuery.isError && posts.length > 0 && (
            <p className="mt-4 text-xs text-slate-400">
              {posts.length} {posts.length === 1 ? "post" : "posts"}
              {hasFilters ? " match your filters" : " available"}
            </p>
          )}

          {/* ── Feed ── */}
          <section className="mt-5 space-y-6">
            {postsQuery.isError ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-8 text-center">
                <AlertCircle className="mx-auto h-7 w-7 text-red-400" />
                <p className="mt-3 font-semibold text-red-700">Could not load the feed.</p>
                <p className="mt-1 text-sm text-red-500">Please check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => postsQuery.refetch()}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
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
                <MemoPostCard
                  key={post.id}
                  post={post}
                  onToast={showToast}
                  feedMode={true}
                />
              ))
            )}
          </section>
        </div>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-2xl border border-[#043658]/10 bg-[#043658] px-5 py-3 text-sm font-medium text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}