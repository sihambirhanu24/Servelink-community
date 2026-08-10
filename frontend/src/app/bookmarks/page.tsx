"use client";

import { memo, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, ArrowRight, ArrowUpRight, BadgeCheck,
  Bookmark, BookmarkX, Calendar, ChevronRight,
  FileDown, FileText, Heart, ImageIcon, Library,
  MessageCircle, RefreshCw, Search, SlidersHorizontal,
  Users, X, Zap,
} from "lucide-react";
import Link from "next/link";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getMediaUrl } from "@/lib/media";
import { getBookmarks, removeBookmark } from "@/services/community";
import { toast } from "sonner";

// ── Types ─────────────────────────────────────────────
interface Attachment { id: string; url: string; type: "IMAGE"|"PDF"|"DOCX"|"VIDEO"; fileName?: string; fileSize?: number }
interface BookmarkedPost {
  id: string; title: string; description: string;
  createdAt?: string; savedAt?: string;
  community?: { id?: string; name: string; type?: string };
  category?: { id?: string; name: string };
  teacher?: { id?: string; firstName: string; lastName: string; level?: string; verified?: boolean; profileImage?: string };
  communityLikes?: Array<{ teacherId: string }>;
  likesCount?: number; comments?: Array<unknown>; commentsCount?: number;
  attachments?: Attachment[];
}

type SortKey = "newest-saved" | "oldest-saved" | "most-likes" | "most-comments";
type AttachmentFilter = "all" | "images" | "pdf" | "docx" | "no-attachment";

// ── Helpers ────────────────────────────────────────────
function formatDate(v?: string) {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
function relTime(v?: string) {
  if (!v) return "";
  const ms = Date.now() - new Date(v).getTime();
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}
function formatBytes(b: number) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b/1024).toFixed(1)} KB`;
  return `${(b/1048576).toFixed(1)} MB`;
}
function hasAttachmentType(post: BookmarkedPost, type: AttachmentFilter) {
  if (type === "all") return true;
  if (type === "no-attachment") return !post.attachments?.length;
  const map: Record<string, string> = { images: "IMAGE", pdf: "PDF", docx: "DOCX" };
  return post.attachments?.some(a => a.type === map[type]) ?? false;
}

// ── Skeleton ───────────────────────────────────────────
function SavedSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="h-9 w-9 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/3 rounded bg-slate-200" />
          <div className="h-2.5 w-1/4 rounded bg-slate-100" />
        </div>
        <div className="h-6 w-6 rounded bg-slate-100" />
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="mt-3 h-12 w-full rounded-lg bg-slate-100" />
      <div className="mt-3 flex gap-3">
        <div className="h-3 w-12 rounded bg-slate-100" />
        <div className="h-3 w-12 rounded bg-slate-100" />
        <div className="ml-auto h-6 w-20 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

// ── Attachment preview ─────────────────────────────────
function AttachmentRow({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter(a => a.type === "IMAGE");
  const docs = attachments.filter(a => a.type !== "IMAGE");
  if (!attachments.length) return null;
  return (
    <div className="mt-3 space-y-1.5">
      {images.length > 0 && (
        <div className={`grid gap-1.5 overflow-hidden rounded-lg ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {images.slice(0, 2).map(img => (
            <div key={img.id} className="relative h-28 overflow-hidden rounded-lg bg-slate-100">
              <img src={getMediaUrl(img.url)} alt={img.fileName ?? "Image"} className="h-full w-full object-cover" onError={e => { e.currentTarget.style.display = "none"; }} />
              {images.length > 2 && img === images[1] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-bold text-white">+{images.length - 2}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {docs.map(doc => {
        const isPdf = doc.type === "PDF";
        const url = getMediaUrl(doc.url);
        return (
          <div key={doc.id} className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${isPdf ? "bg-red-100" : "bg-blue-100"}`}>
              {isPdf ? <FileText className="h-3.5 w-3.5 text-red-600" /> : <FileDown className="h-3.5 w-3.5 text-blue-600" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[#043658]">{doc.fileName ?? doc.type}</p>
              {doc.fileSize ? <p className="text-[10px] text-slate-400">{formatBytes(doc.fileSize)}</p> : null}
            </div>
            <a href={url} download className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-[#043658] hover:bg-slate-50 transition-colors" onClick={e => e.stopPropagation()}>Download</a>
          </div>
        );
      })}
    </div>
  );
}

// ── Saved Resource Card ────────────────────────────────
const SavedCard = memo(function SavedCard({ post, onRemove, isRemoving }: { post: BookmarkedPost; onRemove: (id: string) => void; isRemoving: boolean }) {
  const initials = post.teacher ? `${post.teacher.firstName[0]}${post.teacher.lastName[0]}` : "T";
  const likes = post.communityLikes?.length ?? post.likesCount ?? 0;
  const commentCount = post.comments?.length ?? post.commentsCount ?? 0;
  const savedAt = (post as any).savedAt ?? post.createdAt;
  const hasAttachments = (post.attachments?.length ?? 0) > 0;
  const hasImages = post.attachments?.some(a => a.type === "IMAGE") ?? false;
  const hasDocs = post.attachments?.some(a => a.type === "PDF" || a.type === "DOCX") ?? false;

  return (
    <article className="group rounded-xl border border-[#E2E8F0] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="p-4">
        {/* Header: teacher + bookmark toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">{initials}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-[#043658] truncate">{post.teacher ? `${post.teacher.firstName} ${post.teacher.lastName}` : "Teacher"}</span>
                {post.teacher?.verified && <BadgeCheck className="h-3 w-3 shrink-0 text-[#FFC107]" />}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">
                {post.teacher?.level?.replace("_"," ") ?? "Teacher"}
                {post.community?.name && <> · <span className="text-[#043658]/60">{post.community.name}</span></>}
              </p>
            </div>
          </div>
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(post.id); }} disabled={isRemoving} aria-label="Remove bookmark"
            className="shrink-0 rounded-lg p-1.5 text-[#FFC107] transition hover:bg-red-50 hover:text-red-400 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/30">
            <Bookmark className="h-4 w-4" fill="currentColor" />
          </button>
        </div>

        {/* Badges row */}
        <div className="mt-2 flex flex-wrap gap-1">
          {post.category?.name && (
            <span className="rounded-full bg-[#FFC107]/15 px-2 py-0.5 text-[10px] font-semibold text-[#7a5900]">{post.category.name}</span>
          )}
          {hasImages && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 flex items-center gap-0.5"><ImageIcon className="h-2.5 w-2.5" /> Image</span>}
          {hasDocs && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" /> Resource</span>}
        </div>

        {/* Title + description */}
        <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-[#043658]">{post.title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{post.description}</p>

        {/* Attachments */}
        {hasAttachments && <AttachmentRow attachments={post.attachments!} />}

        {/* Footer: meta + CTA */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{likes}</span>
            <span className="flex items-center gap-0.5"><MessageCircle className="h-3 w-3" />{commentCount}</span>
            {savedAt && <span className="flex items-center gap-0.5 hidden sm:flex"><Calendar className="h-3 w-3" />{relTime(savedAt)}</span>}
          </div>
          <Link href={`/community/post/${post.id}`} onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-lg bg-[#043658] px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#032d4a]">
            Open <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
});

// ── Empty state ────────────────────────────────────────
function EmptyState({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#043658]/8">
        <Bookmark className="h-7 w-7 text-[#043658]/25" />
      </div>
      {hasFilters ? (
        <>
          <p className="mt-4 font-semibold text-[#043658]">No saved resources found.</p>
          <p className="mt-1 text-sm text-slate-400">Try another search or remove some filters.</p>
          <button type="button" onClick={onClear} className="mt-5 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#043658] hover:bg-slate-50 transition-colors">
            <X className="h-4 w-4" /> Clear Filters
          </button>
        </>
      ) : (
        <>
          <p className="mt-4 font-semibold text-[#043658]">Your resource library is empty</p>
          <p className="mt-1 max-w-xs text-sm text-slate-400">Save useful teaching ideas, discussions, and resources from the community and they'll appear here.</p>
          <Link href="/posts" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] transition-colors">
            Explore Teacher Community
          </Link>
          <p className="mt-3 text-xs text-slate-400">Tip: Look for the bookmark icon on any post.</p>
        </>
      )}
    </div>
  );
}

// ── Sidebar cards ──────────────────────────────────────
function LibraryOverviewCard({ bookmarks }: { bookmarks: BookmarkedPost[] }) {
  const withImages = bookmarks.filter(b => b.attachments?.some(a => a.type === "IMAGE")).length;
  const withPdf = bookmarks.filter(b => b.attachments?.some(a => a.type === "PDF")).length;
  const withDocx = bookmarks.filter(b => b.attachments?.some(a => a.type === "DOCX")).length;
  const noAttachment = bookmarks.filter(b => !b.attachments?.length).length;
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#043658]">Your Library</h3>
        <p className="mt-0.5 text-xs text-slate-400">{bookmarks.length} total saved</p>
      </div>
      <div className="divide-y divide-slate-50">
        {[
          { label: "All Saved", count: bookmarks.length, icon: Library },
          { label: "With Images", count: withImages, icon: ImageIcon },
          { label: "PDF Resources", count: withPdf, icon: FileText },
          { label: "DOCX Files", count: withDocx, icon: FileDown },
          { label: "Discussions", count: noAttachment, icon: MessageCircle },
        ].map(({ label, count, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#043658]/8">
                <Icon className="h-3 w-3 text-[#043658]" />
              </div>
              <span className="text-xs font-medium text-slate-600">{label}</span>
            </div>
            <span className="text-xs font-bold text-[#043658]">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicsCard({ bookmarks, onFilter }: { bookmarks: BookmarkedPost[]; onFilter: (cat: string) => void }) {
  const topicCounts = useMemo(() => {
    const map = new Map<string, number>();
    bookmarks.forEach(b => { if (b.category?.name) map.set(b.category.name, (map.get(b.category.name) ?? 0) + 1); });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 7);
  }, [bookmarks]);
  if (!topicCounts.length) return null;
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold text-[#043658]">Your Topics</h3></div>
      <div className="p-3">
        {topicCounts.map(([name, count]) => (
          <button key={name} type="button" onClick={() => onFilter(name)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/20">
            <span className="text-xs font-medium text-[#043658]">{name}</span>
            <span className="rounded-full bg-[#043658]/8 px-2 py-0.5 text-[10px] font-bold text-[#043658]">{count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold text-[#043658]">Quick Actions</h3></div>
      <div className="p-2">
        {[
          { label: "Explore Communities", href: "/community", icon: Users },
          { label: "View My Posts", href: "/profile/posts", icon: FileText },
          { label: "Browse Resources", href: "/posts", icon: Zap },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-[#043658]/5 hover:text-[#043658]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#043658]/8"><Icon className="h-3 w-3 text-[#043658]" /></div>
            {label}
            <ChevronRight className="ml-auto h-3 w-3 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [attachFilter, setAttachFilter] = useState<AttachmentFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest-saved");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const bookmarksQuery = useQuery({ queryKey: ["bookmarks"], queryFn: getBookmarks, staleTime: 30_000 });
  const rawBookmarks = useMemo(() => (bookmarksQuery.data ?? []) as BookmarkedPost[], [bookmarksQuery.data]);

  const communityOptions = useMemo(() => {
    const m = new Map<string, string>();
    rawBookmarks.forEach(b => { if (b.community?.name) m.set(b.community.name, b.community.name); });
    return Array.from(m.keys());
  }, [rawBookmarks]);

  const filtered = useMemo(() => {
    let list = rawBookmarks;
    if (communityFilter !== "all") list = list.filter(b => b.community?.name === communityFilter);
    if (categoryFilter !== "all") list = list.filter(b => b.category?.name === categoryFilter);
    if (attachFilter !== "all") list = list.filter(b => hasAttachmentType(b, attachFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => `${b.title} ${b.description} ${b.teacher?.firstName} ${b.teacher?.lastName} ${b.community?.name} ${b.category?.name}`.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "most-likes") return (b.communityLikes?.length ?? b.likesCount ?? 0) - (a.communityLikes?.length ?? a.likesCount ?? 0);
      if (sort === "most-comments") return (b.comments?.length ?? b.commentsCount ?? 0) - (a.comments?.length ?? a.commentsCount ?? 0);
      const getTs = (p: BookmarkedPost) => new Date(sort === "newest-saved" || sort === "oldest-saved" ? ((p as any).savedAt ?? p.createdAt ?? 0) : (p.createdAt ?? 0)).getTime();
      return sort === "oldest-saved" ? getTs(a) - getTs(b) : getTs(b) - getTs(a);
    });
  }, [rawBookmarks, search, communityFilter, categoryFilter, attachFilter, sort]);

  const hasFilters = search.trim().length > 0 || communityFilter !== "all" || categoryFilter !== "all" || attachFilter !== "all";

  const removeMutation = useMutation({
    mutationFn: removeBookmark,
    onMutate: id => setRemovingId(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData(["bookmarks"], (prev: BookmarkedPost[] | undefined) => (prev ?? []).filter(b => b.id !== id));
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setRemovingId(null);
      toast.success("Removed from saved resources.");
    },
    onError: () => { setRemovingId(null); toast.error("Couldn't remove the bookmark. Please try again."); },
  });

  function clearFilters() { setSearch(""); setCommunityFilter("all"); setCategoryFilter("all"); setAttachFilter("all"); setSort("newest-saved"); }
  function handleTopicFilter(cat: string) { setCategoryFilter(cat); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return (
    <div className="h-screen overflow-hidden bg-[#F7FAFC]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">Professional Library</p>
              <h1 className="mt-1 text-xl font-bold text-[#043658]">Saved Resources</h1>
              <p className="mt-0.5 text-sm text-slate-500">Keep the teaching ideas, discussions, and resources you want to come back to.</p>
              {!bookmarksQuery.isLoading && rawBookmarks.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <span className="text-xs text-slate-400"><span className="font-bold text-[#043658]">{rawBookmarks.length}</span> Saved Posts</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400"><span className="font-bold text-[#043658]">{rawBookmarks.filter(b => b.attachments?.length).length}</span> With Resources</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400"><span className="font-bold text-[#043658]">{rawBookmarks.filter(b => !b.attachments?.length).length}</span> Discussions</span>
                </div>
              )}
            </div>
            <Link href="/posts" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-[#043658]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#043658] shadow-sm transition hover:bg-[#043658] hover:text-white">
              Explore Community <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Search + filters */}
          <div className="mb-4 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your saved resources..."
                className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-9 text-sm text-[#043658] placeholder:text-slate-400 focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/10" />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all","images","pdf","docx","no-attachment"] as const).map(f => (
                <button key={f} type="button" onClick={() => setAttachFilter(f)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${attachFilter === f ? "bg-[#043658] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  {f === "all" ? "All" : f === "images" ? "Images" : f === "pdf" ? "PDF" : f === "docx" ? "DOCX" : "Discussions"}
                </button>
              ))}
              <select value={communityFilter} onChange={e => setCommunityFilter(e.target.value)} className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-[#043658] focus:outline-none">
                <option value="all">All Communities</option>
                {communityOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
              <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-[#043658] focus:outline-none">
                <option value="newest-saved">Recently Saved</option>
                <option value="oldest-saved">Oldest Saved</option>
                <option value="most-likes">Most Liked</option>
                <option value="most-comments">Most Commented</option>
              </select>
              {hasFilters && (
                <button type="button" onClick={clearFilters} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 h-8 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors">
                  <X className="h-3.5 w-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_264px]">

            {/* Left: saved cards */}
            <div className="min-w-0">
              {!bookmarksQuery.isLoading && !bookmarksQuery.isError && filtered.length > 0 && (
                <p className="mb-3 text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "resource" : "resources"}{hasFilters ? " match your filters" : " saved"}</p>
              )}

              {bookmarksQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
                  <p className="mt-2 font-semibold text-red-700">Couldn't load your saved resources.</p>
                  <p className="mt-1 text-sm text-red-500">Please try again.</p>
                  <button type="button" onClick={() => bookmarksQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    <RefreshCw className="h-4 w-4" /> Try Again
                  </button>
                </div>
              ) : bookmarksQuery.isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[1,2,3,4].map(i => <SavedSkeleton key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState hasFilters={hasFilters} onClear={clearFilters} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {filtered.map(post => (
                    <SavedCard key={post.id} post={post} onRemove={id => removeMutation.mutate(id)} isRemoving={removingId === post.id} />
                  ))}
                </div>
              )}
            </div>

            {/* Right sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-0 space-y-4">
                <LibraryOverviewCard bookmarks={rawBookmarks} />
                <TopicsCard bookmarks={rawBookmarks} onFilter={handleTopicFilter} />
                <QuickActionsCard />
              </div>
            </aside>
          </div>

          {/* Mobile sidebar */}
          <div className="mt-6 space-y-4 lg:hidden">
            <LibraryOverviewCard bookmarks={rawBookmarks} />
            <TopicsCard bookmarks={rawBookmarks} onFilter={handleTopicFilter} />
            <QuickActionsCard />
          </div>
        </div>
      </main>
    </div>
  );
}
