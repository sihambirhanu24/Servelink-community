"use client";

import { memo, useMemo, useRef, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, ChevronRight, FileText, GraduationCap,
  ImageIcon, Paperclip, Plus, RefreshCw,
  Search, X, Building2, Globe, CheckCircle2,
  Loader2, UploadCloud, FileDown, Trash2, MessageSquarePlus,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDashboard } from "@/hooks/useDashboard";
import { getCategories, getCommunities, getPosts, createPost, uploadAttachment } from "@/services/community";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import PostCard from "@/components/post/PostCard";

// ── Types ─────────────────────────────────────────────
type SortKey = "newest" | "oldest" | "most-likes" | "most-comments";
type PostType = "Discussion" | "Question" | "Resource" | "Announcement";

interface Post {
  id: string;
  title: string;
  description: string;
  createdAt?: string;
  community?: { id?: string; name: string };
  category?: { id?: string; name: string };
  teacher?: { id?: string; firstName: string; lastName: string; level: string; verified?: boolean; profileImage?: string };
  communityLikes?: Array<{ teacherId: string }>;
  likesCount?: number;
  comments?: Array<unknown>;
  attachments?: Array<{ id: string; url: string; type: "IMAGE" | "PDF" | "DOCX" | "VIDEO"; fileName?: string; fileSize?: number }>;
  liked?: boolean; bookmarked?: boolean; bookmarks?: number;
}

interface PendingFile { id: string; file: File; preview?: string }

const LEVEL_ORDER: Record<string, number> = { LEVEL_1:1, LEVEL_2:2, LEVEL_3:3, LEVEL_4:4, LEVEL_5:5 };
const TYPE_MIN_LEVEL: Record<string, number> = { SCHOOL:1, WOREDA:2, ZONE:3, REGION:4, NATIONAL:5 };
const TYPE_LABEL: Record<string, string> = { SCHOOL:"School Community", WOREDA:"Woreda Community", ZONE:"Zone Community", REGION:"Regional Community", NATIONAL:"National Community" };
const TYPE_ROUTE: Record<string, string> = { SCHOOL:"/community/type/school", WOREDA:"/community/type/woreda", ZONE:"/community/type/zone", REGION:"/community/type/region", NATIONAL:"/community/type/national" };
const TYPE_ICON: Record<string, React.ElementType> = { SCHOOL:GraduationCap, WOREDA:Building2, ZONE:Building2, REGION:Globe, NATIONAL:Globe };
const POST_TYPES: PostType[] = ["Discussion", "Question", "Resource", "Announcement"];
const TRENDING_TAGS = ["#STEMEducation","#Mathematics","#ClassroomManagement","#Assessment","#DigitalLearning","#LessonPlanning","#ActiveLearning"];
const MemoPostCard = memo(PostCard);

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ── Skeletons ──────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-1/3 rounded bg-slate-200" />
          <div className="h-3 w-1/4 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-4 w-3/4 rounded bg-slate-200" />
        <div className="h-3 w-full rounded bg-slate-100" />
        <div className="h-3 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3.5 w-12 rounded bg-slate-100" />
        <div className="h-3.5 w-12 rounded bg-slate-100" />
        <div className="h-3.5 w-12 rounded bg-slate-100" />
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="h-4 w-1/2 rounded bg-slate-200" />
      {[1,2,3].map(i => <div key={i} className="flex items-center gap-2"><div className="h-7 w-7 rounded-lg bg-slate-200" /><div className="h-3 flex-1 rounded bg-slate-100" /></div>)}
    </div>
  );
}

// ── Inline Post Composer ───────────────────────────────
interface ComposerProps {
  communities: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
  onSuccess: (post: Post) => void;
  onCancel: () => void;
}

function PostComposer({ communities, categories, onSuccess, onCancel }: ComposerProps) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const name = profile ? `${profile.firstName} ${profile.lastName}`.trim() : (user ? `${user.firstName} ${user.lastName}`.trim() : "");
  const level = (profile?.level ?? user?.level ?? "LEVEL_1").replace("_", " ");
  const initial = name.charAt(0).toUpperCase() || "T";

  const [postType, setPostType] = useState<PostType>("Discussion");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [communityId, setCommunityId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [publishState, setPublishState] = useState<"idle" | "publishing" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  function validate() {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    else if (title.trim().length < 5) e.title = "Title must be at least 5 characters.";
    if (!description.trim()) e.description = "Description is required.";
    else if (description.trim().length < 10) e.description = "Description must be at least 10 characters.";
    if (!communityId) e.communityId = "Please select a community.";
    if (!categoryId) e.categoryId = "Please select a category.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const allowed = arr.filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
      return ["jpg","jpeg","png","webp","pdf","docx"].includes(ext);
    });
    const newPending: PendingFile[] = allowed.map(f => {
      const id = `${Date.now()}-${Math.random()}`;
      const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined;
      return { id, file: f, preview };
    });
    setPendingFiles(prev => [...prev, ...newPending]);
  }

  function removeFile(id: string) {
    setPendingFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter(f => f.id !== id);
    });
  }

  async function handlePublish() {
    if (!validate()) return;
    setPublishState("publishing");
    setPublishError(null);
    try {
      const newPost = await createPost({ title: title.trim(), description: description.trim(), communityId, categoryId });
      for (const pf of pendingFiles) {
        try { await uploadAttachment(newPost.id, pf.file); } catch { /* non-fatal */ }
      }
      queryClient.invalidateQueries({ queryKey: ["global-feed"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setPublishState("success");
      setTimeout(() => {
        onSuccess(newPost);
        setTitle(""); setDescription(""); setCommunityId(""); setCategoryId("");
        setPendingFiles([]); setErrors({}); setPublishState("idle");
      }, 900);
    } catch {
      setPublishState("error");
      setPublishError("Couldn't publish your post. Please try again.");
    }
  }

  const imageFiles = pendingFiles.filter(f => f.file.type.startsWith("image/"));
  const docFiles = pendingFiles.filter(f => !f.file.type.startsWith("image/"));

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-md">
      {/* Composer header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">{initial}</div>
          <div>
            <p className="text-sm font-semibold text-[#043658]">{name || "Teacher"}</p>
            <span className="inline-block rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#043658]">{level}</span>
          </div>
        </div>
        <button type="button" onClick={onCancel} aria-label="Close composer" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-2.5">
        {/* Post type selector */}
        <div className="flex gap-1 flex-wrap">
          {POST_TYPES.map(t => (
            <button key={t} type="button" onClick={() => setPostType(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#043658]/20 ${
                postType === t ? "bg-[#043658] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Title */}
        <div>
          <input type="text" value={title} onChange={e => { setTitle(e.target.value); if (errors.title) setErrors(p => ({...p, title:""})); }}
            placeholder="What's the title of your post?"
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-medium text-[#043658] placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/15 ${errors.title ? "border-red-400" : "border-[#E2E8F0] focus:border-[#043658]/40"}`} />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <textarea value={description} onChange={e => { setDescription(e.target.value); if (errors.description) setErrors(p => ({...p, description:""})); }}
            placeholder="Share your teaching idea, question, experience, or resource..."
            rows={3}
            className={`w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm text-[#043658] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#043658]/15 ${errors.description ? "border-red-400" : "border-[#E2E8F0] focus:border-[#043658]/40"}`} />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}
        </div>

        {/* Community + Category row */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <select value={communityId} onChange={e => { setCommunityId(e.target.value); if (errors.communityId) setErrors(p => ({...p, communityId:""})); }}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/15 ${errors.communityId ? "border-red-400" : "border-[#E2E8F0] focus:border-[#043658]/40"}`}>
              <option value="">Select Community</option>
              {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.communityId && <p className="mt-0.5 text-xs text-red-500">{errors.communityId}</p>}
          </div>
          <div>
            <select value={categoryId} onChange={e => { setCategoryId(e.target.value); if (errors.categoryId) setErrors(p => ({...p, categoryId:""})); }}
              className={`w-full rounded-lg border bg-white px-3 py-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/15 ${errors.categoryId ? "border-red-400" : "border-[#E2E8F0] focus:border-[#043658]/40"}`}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="mt-0.5 text-xs text-red-500">{errors.categoryId}</p>}
          </div>
        </div>

        {/* Attachment upload area */}
        {pendingFiles.length === 0 ? (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files); }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-3 py-4 text-center transition-colors ${isDragging ? "border-[#043658] bg-[#043658]/5" : "border-slate-200 bg-slate-50 hover:border-[#043658]/40 hover:bg-[#043658]/[0.02]"}`}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className={`h-5 w-5 ${isDragging ? "text-[#043658]" : "text-slate-300"}`} />
            <p className="text-xs font-medium text-slate-500">Add Resources</p>
            <p className="text-[10px] text-slate-400">Drag & drop or <span className="font-semibold text-[#043658]">choose files</span></p>
            <p className="text-[9px] text-slate-300">JPG, PNG, WEBP, PDF, DOCX</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            {imageFiles.length > 0 && (
              <div className={`grid gap-2 mb-3 ${imageFiles.length === 1 ? "grid-cols-1" : imageFiles.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {imageFiles.map(pf => (
                  <div key={pf.id} className="relative group overflow-hidden rounded-lg">
                    <img src={pf.preview} alt={pf.file.name} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => removeFile(pf.id)} aria-label="Remove image"
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100 hover:bg-black/70">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {docFiles.map(pf => {
              const isPdf = pf.file.name.toLowerCase().endsWith(".pdf");
              return (
          <div key={pf.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 mb-1.5 last:mb-0">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${isPdf ? "bg-red-100" : "bg-blue-100"}`}>
                    <FileDown className={`h-3.5 w-3.5 ${isPdf ? "text-red-600" : "text-blue-600"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-[#043658]">{pf.file.name}</p>
                    <p className="text-[10px] text-slate-400">{formatBytes(pf.file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeFile(pf.id)} aria-label="Remove file" className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#043658] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add more files
            </button>
          </div>
        )}
        <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.docx" className="hidden"
          onChange={e => { if (e.target.files) { addFiles(e.target.files); e.target.value = ""; }}} />

        {publishError && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <p className="text-sm text-red-600">{publishError}</p>
          </div>
        )}
      </div>

      {/* Composer footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Add image"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-[#043658]">
            <ImageIcon className="h-3 w-3" /> Image
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} aria-label="Add file"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-[#043658]">
            <Paperclip className="h-3 w-3" /> File
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#043658]/20">
            Cancel
          </button>
          <button type="button" onClick={handlePublish} disabled={publishState === "publishing" || publishState === "success"}
            className={`inline-flex min-w-[100px] items-center justify-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#043658]/30 disabled:cursor-not-allowed disabled:opacity-70 ${
              publishState === "success" ? "bg-emerald-600" : "bg-[#043658] hover:bg-[#032d4a] active:scale-[0.98]"}`}>
            {publishState === "idle" && "Publish Post"}
            {publishState === "publishing" && <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>}
            {publishState === "success" && <><CheckCircle2 className="h-4 w-4" />Published!</>}
            {publishState === "error" && "Try Again"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar cards ──────────────────────────────────────
function CommunitiesSideCard() {
  const { data: profile, isLoading } = useProfile();
  const levelNum = LEVEL_ORDER[profile?.level ?? "LEVEL_1"] ?? 1;
  const types = ["SCHOOL","WOREDA","ZONE","REGION","NATIONAL"] as const;
  const unlockedTypes = types.filter(type => levelNum >= (TYPE_MIN_LEVEL[type] ?? 99));

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold text-[#043658]">My Communities</h3></div>
      <div className="p-2">
        {isLoading ? (
          <div className="animate-pulse space-y-2 p-2">
            {[1,2,3].map(i=><div key={i} className="h-8 rounded-lg bg-slate-100"/>)}
          </div>
        ) : (
          unlockedTypes.map(type => {
            const Icon = TYPE_ICON[type] ?? GraduationCap;
            return (
              <Link key={type} href={TYPE_ROUTE[type]}>
                <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-[#043658]/5 cursor-pointer">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#043658]/8">
                    <Icon className="h-3.5 w-3.5 text-[#043658]" />
                  </div>
                  <span className="flex-1 text-xs font-medium text-[#043658]">{TYPE_LABEL[type]}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

function ProgressSideCard() {
  const { data: profile, isLoading } = useProfile();
  const level = profile?.level ?? "LEVEL_1";
  const levelNum = LEVEL_ORDER[level] ?? 1;
  const pct = Math.round((levelNum / 5) * 100);
  const label = level.replace("_"," ");
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-[#043658]">Your Progress</h3>
        <p className="mt-0.5 text-xs text-slate-400">Keep contributing to reach the next level.</p>
      </div>
      <div className="p-4">
        {isLoading ? <div className="animate-pulse space-y-3"><div className="h-4 w-16 rounded bg-slate-200"/><div className="h-2 w-full rounded-full bg-slate-200"/><div className="h-3 w-24 rounded bg-slate-100"/></div> : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#043658]">{label}</span>
              <span className="text-xs font-semibold text-[#043658]">{pct}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#FFC107] transition-all duration-500" style={{width:`${pct}%`}} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}/>
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-slate-400">
              <span>{label}</span>
              {levelNum < 5 && <span>Level {levelNum+1}</span>}
            </div>
            {levelNum < 5 ? <p className="mt-2 text-xs text-slate-500">{levelNum} of 5 levels reached</p> : <p className="mt-2 text-xs font-semibold text-[#043658]">Maximum level reached 🎉</p>}
          </>
        )}
      </div>
    </div>
  );
}

function TrendingTopicsSideCard() {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold text-[#043658]">Trending Topics</h3></div>
      <div className="flex flex-wrap gap-2 p-4">
        {TRENDING_TAGS.map(tag => (
          <span key={tag} className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-[#043658] transition-colors hover:bg-[#043658]/8">{tag}</span>
        ))}
      </div>
    </div>
  );
}

function PopularResourcesSideCard() {
  const { data, isLoading } = useDashboard();
  const posts = data?.recentPosts ?? [];
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3"><h3 className="text-sm font-semibold text-[#043658]">Popular Resources</h3></div>
      <div className="p-2">
        {isLoading ? <SidebarSkeleton /> : posts.length === 0 ? (
          <p className="px-3 py-3 text-xs text-slate-400">No resources yet.</p>
        ) : posts.slice(0,5).map(post => (
          <Link key={post.id} href={`/community/posts/${post.id}`} className="flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-slate-50">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFC107]/15">
              <FileText className="h-3.5 w-3.5 text-[#043658]" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[#043658]">{post.title}</p>
              <p className="text-[10px] text-slate-400">{post._count.communityLikes} likes · {post._count.comments} comments</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="border-t border-slate-100 px-4 py-2.5">
        <Link href="/posts" className="flex items-center gap-1 text-xs font-semibold text-[#043658] hover:underline">View All Resources <ChevronRight className="h-3.5 w-3.5"/></Link>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────
export default function PostsPage() {
  const [search, setSearch] = useState("");
  const [communityId, setCommunityId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [composerOpen, setComposerOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const communitiesQuery = useQuery({ queryKey: ["communities"], queryFn: getCommunities, staleTime: 60_000 });
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: getCategories, staleTime: 60_000 });
  const postsQuery = useQuery({
    queryKey: ["global-feed", communityId, categoryId],
    queryFn: () => getPosts({ communityId: communityId !== "all" ? communityId : undefined, categoryId: categoryId !== "all" ? categoryId : undefined, page: 1, limit: 50 }),
    staleTime: 30_000,
  });

  const communities = useMemo(() => (communitiesQuery.data ?? []) as Array<{ id: string; name: string }>, [communitiesQuery.data]);
  const categories = useMemo(() => (categoriesQuery.data ?? []) as Array<{ id: string; name: string }>, [categoriesQuery.data]);

  const posts = useMemo(() => {
    const raw = (postsQuery.data ?? []) as Post[];
    const filtered = search.trim() ? raw.filter(p => `${p.title} ${p.description} ${p.teacher?.firstName} ${p.teacher?.lastName}`.toLowerCase().includes(search.toLowerCase())) : raw;
    return [...filtered].sort((a, b) => {
      if (sort === "most-likes") return (b.communityLikes?.length ?? b.likesCount ?? 0) - (a.communityLikes?.length ?? a.likesCount ?? 0);
      if (sort === "most-comments") return (b.comments?.length ?? 0) - (a.comments?.length ?? 0);
      const aMs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bMs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sort === "oldest" ? aMs - bMs : bMs - aMs;
    });
  }, [postsQuery.data, search, sort]);

  const hasFilters = search.trim().length > 0 || communityId !== "all" || categoryId !== "all";

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 2800); }

  const handlePostSuccess = useCallback((newPost: Post) => {
    setComposerOpen(false);
    showToast("Your post was published successfully.");
    queryClient.invalidateQueries({ queryKey: ["global-feed"] });
  }, [queryClient]);

  return (
    <div className="h-screen overflow-hidden bg-[#F7FAFC]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#043658]">Teacher Community</h1>
              <p className="mt-0.5 text-sm text-slate-500">Connect, share resources, and collaborate with fellow educators.</p>
            </div>
            <button type="button" onClick={() => setComposerOpen(o => !o)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#032d4a] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
              {composerOpen ? <><X className="h-4 w-4"/> Cancel</> : <><Plus className="h-4 w-4"/> Create Post</>}
            </button>
          </div>

          {/* Search + filters */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
                className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-9 text-sm text-[#043658] placeholder:text-slate-400 focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/10" />
              {search && <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5"/></button>}
            </div>
            <select value={communityId} onChange={e => setCommunityId(e.target.value)} className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#043658] focus:border-[#043658]/40 focus:outline-none">
              <option value="all">All Communities</option>
              {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#043658] focus:border-[#043658]/40 focus:outline-none">
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={sort} onChange={e => setSort(e.target.value as SortKey)} className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#043658] focus:border-[#043658]/40 focus:outline-none">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="most-likes">Most Liked</option>
              <option value="most-comments">Most Commented</option>
            </select>
            {hasFilters && (
              <button type="button" onClick={() => { setSearch(""); setCommunityId("all"); setCategoryId("all"); setSort("newest"); }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 h-9 text-xs font-medium text-slate-500 hover:text-red-500 transition-colors">
                <X className="h-3.5 w-3.5"/> Clear
              </button>
            )}
          </div>

          {/* 2-column grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">

            {/* Left: composer + feed */}
            <div className="min-w-0 space-y-4">

              {/* Collapsed composer prompt */}
              {!composerOpen && (
                <button type="button" onClick={() => setComposerOpen(true)}
                  className="w-full flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 text-sm text-slate-400 shadow-sm transition hover:border-[#043658]/30 hover:bg-slate-50 text-left">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658]/10">
                    <MessageSquarePlus className="h-4 w-4 text-[#043658]" />
                  </div>
                  What&apos;s on your mind, teacher? Share an idea, question, or resource…
                </button>
              )}

              {/* Expanded composer */}
              {composerOpen && (
                <PostComposer
                  communities={communities}
                  categories={categories}
                  onSuccess={handlePostSuccess}
                  onCancel={() => setComposerOpen(false)}
                />
              )}

              {/* Post count */}
              {!postsQuery.isLoading && !postsQuery.isError && posts.length > 0 && (
                <p className="text-xs text-slate-400">{posts.length} {posts.length === 1 ? "post" : "posts"}{hasFilters ? " match your filters" : ""}</p>
              )}

              {/* Feed */}
              {postsQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
                  <p className="mt-2 font-semibold text-red-700">Couldn&apos;t load the community feed.</p>
                  <p className="mt-1 text-sm text-red-500">Please try again.</p>
                  <button type="button" onClick={() => postsQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                    <RefreshCw className="h-4 w-4"/> Try Again
                  </button>
                </div>
              ) : postsQuery.isLoading ? (
                <><PostSkeleton/><PostSkeleton/><PostSkeleton/></>
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white px-8 py-14 text-center">
                  {hasFilters ? (
                    <><Search className="h-8 w-8 text-slate-300"/><p className="mt-3 font-semibold text-[#043658]">No posts found.</p><p className="mt-1 text-sm text-slate-400">Try another search or remove some filters.</p></>
                  ) : (
                    <><p className="font-semibold text-[#043658]">Your community is waiting for its first conversation.</p><p className="mt-1 text-sm text-slate-400">Share a teaching idea, question, or useful resource.</p><button type="button" onClick={() => setComposerOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742]"><Plus className="h-4 w-4"/>Create Your First Post</button></>
                  )}
                </div>
              ) : (
                posts.map(post => <MemoPostCard key={post.id} post={post} onToast={showToast} feedMode/>)
              )}
            </div>

            {/* Right sticky sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-0 space-y-4">
                <CommunitiesSideCard/>
                <ProgressSideCard/>
                <TrendingTopicsSideCard/>
                <PopularResourcesSideCard/>
              </div>
            </aside>
          </div>

          {/* Mobile sidebar */}
          <div className="mt-6 space-y-4 lg:hidden">
            <CommunitiesSideCard/>
            <ProgressSideCard/>
            <TrendingTopicsSideCard/>
            <PopularResourcesSideCard/>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-[#043658]/10 bg-[#043658] px-5 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-[#FFC107]"/>{toast}
        </div>
      )}
    </div>
  );
}
