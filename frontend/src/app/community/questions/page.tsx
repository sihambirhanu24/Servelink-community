"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HelpCircle, Search, SlidersHorizontal, Plus, CheckCircle2,
  Clock, Lock, Trophy, ChevronLeft, ChevronRight, MessageCircle,
  Tag, Loader2, ArrowLeft,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useVerification } from "@/hooks/useVerification";
import { useQuestions, useCreateQuestion } from "@/hooks/useQuestions";
import { getCategories } from "@/services/community";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { toast } from "sonner";
import type { QuestionFilter, QuestionSortKey } from "@/services/questions";
import type { CommunityTypeKey } from "@/services/community";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function countdown(deadline: string): string {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
  if (h > 0)  return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

function levelLabel(raw: string) {
  return String(raw).replace(/^LEVEL_/, "Level ").replace(/_/g, " ");
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, deadline }: { status: string; deadline?: string | null }) {
  if (status === "SOLVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
        <Trophy className="h-3 w-3" /> Solved
      </span>
    );
  }
  if (status === "CLOSED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
        <CheckCircle2 className="h-3 w-3" /> Closed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
      <Clock className="h-3 w-3" />
      {deadline ? countdown(deadline) : "Open"}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function QuestionCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-full rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ─── Create Question Modal ────────────────────────────────────────────────────

const DEADLINE_OPTIONS = [
  { label: "1 hour",  value: 1    },
  { label: "6 hours", value: 6    },
  { label: "24 hours",value: 24   },
  { label: "3 days",  value: 72   },
  { label: "7 days",  value: 168  },
  { label: "Custom…", value: 0    },
];

function CreateQuestionModal({
  onClose,
  communityType = "NETWORK",
}: {
  onClose: () => void;
  communityType?: CommunityTypeKey;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deadlineHours, setDeadlineHours] = useState<number>(24);
  const [customDeadline, setCustomDeadline] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileRef = useState<HTMLInputElement | null>(null);

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const createMutation = useCreateQuestion();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!description.trim()) { toast.error("Please enter details"); return; }
    if (!categoryId) { toast.error("Please select a category"); return; }

    let deadline: string;
    if (deadlineHours === 0) {
      deadline = customDeadline;
    } else {
      const deadlineDate = new Date();
      deadlineDate.setHours(deadlineDate.getHours() + (deadlineHours || 24));
      deadline = deadlineDate.toISOString();
    }

    try {
      const post = await createMutation.mutateAsync({
        communityType,
        title: title.trim(),
        description: description.trim(),
        categoryId,
        deadline,
      });

      // Upload attachment if any
      if (attachedFile) {
        const form = new FormData();
        form.append("file", attachedFile);
        await api.post(`/community/posts/${post.id}/attachment`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success("Question posted!");
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to post question");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#043658]">
            <HelpCircle className="h-5 w-5 text-[#FFC107]" /> Ask a Question
          </h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Context indicator */}
        <div className="border-b border-slate-100 bg-[#043658]/5 px-6 py-3 shrink-0">
          <p className="text-xs text-slate-500">
            <span className="font-semibold text-[#043658]">Posting to:</span>{" "}
            {communityType.charAt(0) + communityType.slice(1).toLowerCase()} Community
            {" · "}Answers hidden until deadline — teachers answer independently
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to know? Be specific…"
              maxLength={200}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
            <p className="mt-1 text-right text-[10px] text-slate-400">{title.length}/200</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Provide context — what have you tried, what exactly do you need to know?"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
              >
                <option value="">Select category…</option>
                {(categories as any[]).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Answer deadline <span className="text-red-500">*</span>
              </label>
              <select
                value={deadlineHours}
                onChange={(e) => setDeadlineHours(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
              >
                {DEADLINE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {deadlineHours === 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">Custom deadline (date & time)</label>
              <input
                type="datetime-local"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
              />
            </div>
          )}

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-bold">Blind answer period:</span> Other teachers cannot see each other's answers until the deadline. This ensures independent responses.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60"
          >
            {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</> : <><HelpCircle className="h-4 w-4" /> Post Question</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function QuestionsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<QuestionFilter>("all");
  const [sort, setSort] = useState<QuestionSortKey>("newest");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const { status: verificationStatus } = useVerification();
  const isVerified = verificationStatus?.verificationStatus === "APPROVED";

  const { data, isLoading, isError } = useQuestions({
    status: statusFilter,
    sort,
    search: search || undefined,
    mine,
    page,
    limit: 15,
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;

  const FILTERS: { label: string; value: QuestionFilter }[] = [
    { label: "All",       value: "all"    },
    { label: "Open",      value: "OPEN"   },
    { label: "Closed",    value: "CLOSED" },
    { label: "Solved",    value: "SOLVED" },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <button
                onClick={() => router.push("/community")}
                className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#043658] transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Community
              </button>
              <h1 className="font-['Lexend'] text-2xl font-bold text-[#043658]">Questions & Answers</h1>
              <p className="mt-1 text-sm text-slate-500">
                Ask questions, share knowledge. Answers are hidden until the deadline.
              </p>
            </div>
            <button
              onClick={() => {
                if (!isVerified) {
                  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("show-verification-modal"));
                  return;
                }
                setShowCreate(true);
              }}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#032742] transition-colors"
            >
              <Plus className="h-4 w-4" /> Ask a Question
            </button>
          </div>

          {/* Filters bar */}
          <div className="mb-5 space-y-3">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search questions…"
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>

            {/* Status + sort + mine toggle */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => { setStatusFilter(f.value); setPage(1); }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    statusFilter === f.value
                      ? "border-[#043658] bg-[#043658] text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => { setMine(!mine); setPage(1); }}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    mine ? "border-[#FFC107] bg-[#FFC107]/10 text-[#043658]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  My Questions
                </button>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value as QuestionSortKey); setPage(1); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="most-answers">Most Answers</option>
                  <option value="ending-soon">Ending Soon</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-3">
            {isLoading ? (
              [1,2,3,4,5].map((i) => <QuestionCardSkeleton key={i} />)
            ) : isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                Could not load questions. Please try again.
              </div>
            ) : questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <HelpCircle className="h-12 w-12 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-700">
                  {statusFilter !== "all" ? `No ${statusFilter.toLowerCase()} questions` : mine ? "You haven't asked any questions yet" : "No questions yet"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {!mine && statusFilter === "all" ? "Be the first teacher to ask a question." : "Try a different filter."}
                </p>
                {isVerified && statusFilter === "all" && !mine && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2 text-sm font-semibold text-white hover:bg-[#032742]"
                  >
                    <Plus className="h-4 w-4" /> Ask a Question
                  </button>
                )}
              </div>
            ) : questions.map((q) => (
              <Link key={q.id} href={`/community/questions/${q.id}`} className="group block">
                <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[#043658]/30 hover:shadow-md transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#043658]/10 text-sm font-bold text-[#043658]">
                      {q.teacher.firstName[0]}{q.teacher.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-[#043658]">
                          {q.teacher.firstName} {q.teacher.lastName}
                        </span>
                        <span className="text-[10px] font-semibold rounded-full bg-[#043658]/8 px-2 py-0.5 text-[#043658]">
                          {levelLabel(q.teacher.level)}
                        </span>
                        <span className="text-xs text-slate-400">{timeAgo(q.createdAt)}</span>
                        <div className="ml-auto">
                          <StatusBadge status={q.effectiveStatus} deadline={q.deadline} />
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-[#043658] group-hover:text-[#043658] line-clamp-2">
                        {q.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{q.description}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {q.category && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            <Tag className="h-3 w-3" /> {q.category.name}
                          </span>
                        )}
                        {/* Blind period indicator */}
                        {q.effectiveStatus === "OPEN" ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <Lock className="h-3 w-3" />
                            {q.answerCount > 0 ? `${q.answerCount} answer${q.answerCount > 1 ? "s" : ""} hidden` : "No answers yet"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <MessageCircle className="h-3 w-3" />
                            {q.answerCount} answer{q.answerCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-slate-500">Page {meta.page} of {meta.totalPages} · {meta.total} questions</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPages}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-white disabled:opacity-40"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showCreate && (
        <CreateQuestionModal
          onClose={() => setShowCreate(false)}
          communityType="NETWORK"
        />
      )}
    </div>
  );
}
