"use client";

import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X, HelpCircle, MessageCircle, FileText, Loader2, Paperclip, Globe,
  School, MapPin, Building2, Flag, Trophy,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { getCategories } from "@/services/community";
import { createPostByType, type CommunityTypeKey } from "@/services/community";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = "QUESTION" | "RESOURCE";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: PostType;
  /** The community context this post belongs to — derived from the current route. */
  communityType: CommunityTypeKey;
}

// ─── Community context config ─────────────────────────────────────────────────

const COMMUNITY_CFG: Record<CommunityTypeKey, {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}> = {
  NETWORK: {
    icon: <Globe className="h-5 w-5" />,
    label: "Network Community",
    description: "Your post will be visible to educators across the network.",
    color: "text-[#043658]",
    bg: "bg-[#043658]/5",
    border: "border-[#043658]/20",
  },
  SCHOOL: {
    icon: <School className="h-5 w-5" />,
    label: "School Community",
    description: "Your post will be visible to teachers in your school.",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  WOREDA: {
    icon: <MapPin className="h-5 w-5" />,
    label: "Woreda Community",
    description: "Your post will be visible to teachers in your woreda.",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  ZONE: {
    icon: <Building2 className="h-5 w-5" />,
    label: "Zone Community",
    description: "Your post will be visible to teachers in your zone.",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  REGION: {
    icon: <Flag className="h-5 w-5" />,
    label: "Region Community",
    description: "Your post will be visible to teachers in your region.",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
  },
  NATIONAL: {
    icon: <Trophy className="h-5 w-5" />,
    label: "National Community",
    description: "Your post will be visible to all teachers nationwide.",
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
  },
};

// ─── Post type config ─────────────────────────────────────────────────────────

const POST_TYPE_CFG: Record<PostType, {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  descPlaceholder: string;
}> = {
  QUESTION: {
    label: "Ask a Question",
    icon: <HelpCircle className="h-4 w-4" />,
    placeholder: "What would you like to ask? Be specific…",
    descPlaceholder: "Provide more context — what have you tried, what exactly do you need to know?",
  },
  RESOURCE: {
    label: "Share a Resource",
    icon: <FileText className="h-4 w-4" />,
    placeholder: "Resource title",
    descPlaceholder: "Describe this resource and how it helps other teachers…",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function CreatePostModal({
  isOpen,
  onClose,
  defaultType = "RESOURCE",
  communityType,
}: CreatePostModalProps) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [postType, setPostType] = useState<PostType>(defaultType);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const commCfg = COMMUNITY_CFG[communityType] ?? COMMUNITY_CFG.NETWORK;
  const ptCfg = POST_TYPE_CFG[postType];

  const createMutation = useMutation({
    mutationFn: async () => {
      // 1. Create post — backend resolves the real community from communityType
      const post = await createPostByType({
        communityType,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        postType,
      });

      // 2. Upload attachment if present
      if (attachedFile) {
        const form = new FormData();
        form.append("file", attachedFile);
        await api.post(`/community/posts/${post.id}/attachment`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      return post;
    },
    onSuccess: () => {
      toast.success(
        postType === "QUESTION" ? "Question posted!" : "Resource shared!"
      );
      qc.invalidateQueries({ queryKey: ["community-feed"] });
      qc.invalidateQueries({ queryKey: ["network-overview"] });
      qc.invalidateQueries({ queryKey: ["community-type-posts"] });
      qc.invalidateQueries({ queryKey: ["community", "type", communityType.toLowerCase(), "posts"] });
      qc.invalidateQueries({ queryKey: ["questions"] });
      reset();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to create post");
    },
  });

  function reset() {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setAttachedFile(null);
    setPostType(defaultType);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { toast.error("File must be under 10 MB"); return; }
    setAttachedFile(f);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!description.trim()) { toast.error("Please enter a description"); return; }
    if (!categoryId) { toast.error("Please select a category"); return; }
    createMutation.mutate();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="text-lg font-bold text-[#043658]">Create Post</h2>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Post type selector ─────────────────────────────────────────── */}
        <div className="flex gap-2 border-b border-slate-100 px-6 py-3 shrink-0 overflow-x-auto">
          {(["QUESTION", "RESOURCE"] as PostType[]).map((t) => {
            const c = POST_TYPE_CFG[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setPostType(t)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  postType === t
                    ? "bg-[#043658] text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.icon} {c.label}
              </button>
            );
          })}
        </div>

        {/* ── Form body ─────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        >
          {/* Community context indicator — non-editable, shows where post goes */}
          <div className={`flex items-start gap-3 rounded-xl border ${commCfg.border} ${commCfg.bg} px-4 py-3`}>
            <span className={`shrink-0 mt-0.5 ${commCfg.color}`}>{commCfg.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
                Posting to
              </p>
              <p className={`text-sm font-bold ${commCfg.color}`}>{commCfg.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{commCfg.description}</p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={ptCfg.placeholder}
              maxLength={200}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">
              {title.length}/200
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              {postType === "QUESTION" ? "Question details" :
               postType === "RESOURCE" ? "Description" : "Content"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder={ptCfg.descPlaceholder}
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>

          {/* Category — the only dropdown remaining */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
            >
              <option value="">Select a category…</option>
              {(categories as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Attachment */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Attachment{" "}
              <span className="font-normal text-slate-400">
                (optional — image, PDF, DOCX, video)
              </span>
            </label>
            {attachedFile ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <span className="flex-1 truncate text-xs text-slate-700">
                  {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 py-3 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Paperclip className="h-4 w-4" />
                Click to attach a file (max 10 MB)
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.docx,.doc,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </form>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={createMutation.isPending}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</>
            ) : (
              <>{ptCfg.icon} {ptCfg.label}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
