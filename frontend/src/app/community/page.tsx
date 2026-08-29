"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";
import { getPosts, getCommunities, getCategories } from "@/services/community";
import PostCard from "@/components/post/PostCard";
import { CommunitySideRail } from "@/components/community/CommunitySideRail";
import { CommunityFilters } from "@/components/community/CommunityFilters";
import { OverviewTab } from "@/components/community/network/OverviewTab";
import { CommunityMembersTab } from "@/components/community/CommunityMembersTab";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { ResourceCard } from "@/components/community/resource/ResourceCard";
import { useDiscussions } from "@/hooks/useDiscussions";
import { StartDiscussionModal } from "@/components/discussion/StartDiscussionModal";
import { formatDistanceToNow } from "date-fns";
import { Avatar } from "@/components/common/Avatar";
import { fetchMembersByType } from "@/services/community-type";
import { useQuestions, useCreateQuestion } from "@/hooks/useQuestions";
import api from "@/lib/axios";
import { toast } from "sonner";
import type { QuestionFilter, QuestionSortKey } from "@/services/questions";
import {
  MessageCircle, HelpCircle, FileText, TrendingUp, Users, Plus,
  Clock, Trophy, Lock, Tag, ChevronLeft, ChevronRight,
  X, Search as SearchIcon, AlertCircle, Loader2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "questions" | "discussions" | "resources" | "members";

const TAB_POST_TYPE: Partial<Record<Tab, string>> = {
  discussions: "DISCUSSION",
  resources:   "RESOURCE",
};

const EMPTY_STATE: Record<Tab, { icon: React.ReactNode; title: string; message: string; action: string }> = {
  overview:    { icon: <TrendingUp className="h-10 w-10 text-slate-300" />, title: "Nothing to show", message: "", action: "" },
  questions:   { icon: <HelpCircle  className="h-10 w-10 text-slate-300" />, title: "No questions yet", message: "Be the first teacher to ask a question.", action: "Ask a Question" },
  discussions: { icon: <MessageCircle className="h-10 w-10 text-slate-300" />, title: "No discussions yet", message: "Start a professional conversation.", action: "Start Discussion" },
  resources:   { icon: <FileText    className="h-10 w-10 text-slate-300" />, title: "No resources yet", message: "Share a resource that could help another teacher.", action: "Share Resource" },
  members:     { icon: <Users       className="h-10 w-10 text-slate-300" />, title: "No members found", message: "Try a different search.", action: "" },
};

// ─── Q&A helpers ─────────────────────────────────────────────────────────────

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
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

function QStatusBadge({ status, deadline }: { status: string; deadline?: string | null }) {
  if (status === "SOLVED")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1.5 text-[11px] font-bold text-emerald-800 shadow-sm border border-emerald-200"><Trophy className="h-3.5 w-3.5" /> Solved</span>;
  if (status === "CLOSED")
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm border border-slate-200"><span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> Closed</span>;
  
  const isEndingSoon = deadline && (new Date(deadline).getTime() - Date.now() < 3600000 * 3); // 3 hours
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold shadow-sm border transition-all ${isEndingSoon ? "bg-red-50 text-red-700 border-red-200 animate-pulse" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
      <Clock className="h-3.5 w-3.5" /> {deadline ? countdown(deadline) : "Open"}
    </span>
  );
}

function QSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-100 shrink-0" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-3 w-32 rounded-full bg-slate-100" />
          <div className="h-5 w-3/4 rounded-md bg-slate-100" />
          <div className="h-4 w-full rounded-md bg-slate-50" />
        </div>
      </div>
    </div>
  );
}

// ─── Deadline options ─────────────────────────────────────────────────────────

const DEADLINE_OPTIONS = [
  { label: "1 hour",  value: 1   },
  { label: "2 minutes", value: -2 },
  { label: "6 hours", value: 6   },
  { label: "24 hours",value: 24  },
  { label: "3 days",  value: 72  },
  { label: "7 days",  value: 168 },
  { label: "Custom…", value: 0   },
];

// ─── Ask Question Modal (with deadline) ──────────────────────────────────────

function AskQuestionModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [deadlineHours, setDeadlineHours] = useState<number>(24);
  const [customDeadline, setCustomDeadline] = useState("");

  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const createMutation = useCreateQuestion();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())       { toast.error("Please enter a title");     return; }
    if (!description.trim()) { toast.error("Please enter details");     return; }
    if (!categoryId)         { toast.error("Please select a category"); return; }
    if (deadlineHours === 0 && !customDeadline) { toast.error("Please set a custom deadline"); return; }

    // Convert deadline to ISO 8601 DateTime string
    let deadline: string;
    if (deadlineHours === 0) {
      deadline = customDeadline;
    } else if (deadlineHours === -2) {
      const deadlineDate = new Date();
      deadlineDate.setMinutes(deadlineDate.getMinutes() + 2);
      deadline = deadlineDate.toISOString();
    } else {
      const deadlineDate = new Date();
      deadlineDate.setHours(deadlineDate.getHours() + deadlineHours);
      deadline = deadlineDate.toISOString();
    }

    try {
      await createMutation.mutateAsync({
        communityType: "NETWORK",
        title:       title.trim(),
        description: description.trim(),
        categoryId,
        deadline,
      });
      toast.success("Question posted!");
      setTitle("");
      setDescription("");
      setCategoryId("");
      setDeadlineHours(24);
      setCustomDeadline("");
      onClose();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message ?? err?.message ?? "Failed to post question";
      toast.error(errorMessage);
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
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Community context */}
        <div className="border-b border-slate-100 bg-[#043658]/5 px-6 py-3 shrink-0 flex items-center gap-2">
          <span className="text-[#043658]">🌐</span>
          <div>
            <p className="text-xs font-bold text-[#043658]">Posting to Network Community</p>
            <p className="text-[11px] text-slate-500">Answers are hidden from other teachers until the deadline — everyone answers independently.</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Title */}
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

          {/* Details */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Question details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Provide context — what have you tried, what exactly do you need to know?"
              className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>

          {/* Category + Deadline */}
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
                <option value="">Select a category…</option>
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

          {/* Custom deadline picker */}
          {deadlineHours === 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Custom deadline (date &amp; time) <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={customDeadline}
                onChange={(e) => setCustomDeadline(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none"
              />
            </div>
          )}

          {/* Info box */}
          <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              <span className="font-bold">🔒 Blind answer period:</span> Other teachers cannot see each other's answers until the deadline. This ensures independent, unbiased responses.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button type="button" onClick={onClose} disabled={createMutation.isPending} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60"
          >
            {createMutation.isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Posting…</>
              : <><HelpCircle className="h-4 w-4" /> Post Question</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Discussions Tab (embedded in community page) ───────────────────────────────

function DiscussionsTab({ isVerified }: { isVerified: boolean }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'mostReplied'>('latest');
  const [filterTab, setFilterTab] = useState<'all' | 'my' | 'following'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useDiscussions({
    sortBy: sortBy === 'popular' ? 'mostActive' : sortBy === 'mostReplied' ? 'mostDiscussed' : 'latest',
    page: 1,
    limit: 20,
  });

  const handleStartDiscussion = () => {
    if (!isVerified) { window.dispatchEvent(new CustomEvent("show-verification-modal")); return; }
    setIsModalOpen(true);
  };

  const handleDiscussionClick = (discussionId: string) => {
    router.push(`/community/network/discussions/${discussionId}`);
  };

  const handleDiscussionCreated = (discussionId: string) => {
    // Close modal and refresh the list instead of redirecting
    setIsModalOpen(false);
    refetch();
    // Success feedback - the toast is already imported for QuestionsTab
  };

  const filteredDiscussions = data?.data.filter(d => {
    if (searchQuery) {
      return d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
             d.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  }) || [];

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="min-w-0 space-y-4">
        {/* Filter tabs with modern styling */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200" style={{ minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ minWidth: 0, height: '56px' }}>
            <div className="flex items-center gap-2 overflow-x-auto" style={{ minWidth: 0 }}>
              {(['all', 'my', 'following'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-4 py-2 text-xs font-medium rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${
                    filterTab === tab
                      ? 'bg-[#043658] text-white shadow-sm'
                      : 'text-[#043658] hover:bg-slate-100'
                  }`}
                >
                  {tab === 'all' ? 'All Discussions' : tab === 'my' ? 'My Discussions' : 'Following'}
                </button>
              ))}
              <div className="w-px h-6 bg-slate-200 flex-shrink-0 mx-1" />
              <button className="px-4 py-2 text-xs font-medium text-[#043658] hover:bg-slate-100 rounded-lg whitespace-nowrap flex-shrink-0">
                Popular
              </button>
              <button className="px-4 py-2 text-xs font-medium text-[#043658] hover:bg-slate-100 rounded-lg whitespace-nowrap flex-shrink-0">
                Recent
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center flex-shrink-0 ml-auto">
              <div className="relative" style={{ minWidth: '180px', maxWidth: '220px', width: '200px' }}>
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search discussions..."
                  className="pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FFC107] focus:border-transparent w-full bg-slate-50"
                  style={{ boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Discussion list with enhanced cards */}
        <div className="space-y-3">
          {isLoading ? (
            [1,2,3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200" />
                    <div className="h-3 w-48 rounded bg-slate-200" />
                  </div>
                </div>
              </div>
            ))
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Failed to load discussions</p>
                <p className="text-xs text-red-700 mt-1">Please try again later.</p>
              </div>
            </div>
          ) : filteredDiscussions.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#043658]/10 to-[#FFC107]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-[#043658]" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">No discussions yet</h3>
              <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
                Start the first discussion and connect with educators nationwide
              </p>
              {isVerified && (
                <button 
                  onClick={handleStartDiscussion}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FFC107] to-yellow-500 text-[#043658] rounded-xl text-sm font-bold hover:from-yellow-500 hover:to-[#FFC107] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Plus className="h-4 w-4" />
                  Start Discussion
                </button>
              )}
            </div>
          ) : (
            filteredDiscussions.map((discussion, index) => {
              const authorName = `${discussion.author.firstName} ${discussion.author.lastName}`;
              const timeAgo = formatDistanceToNow(new Date(discussion.lastActiveAt), { addSuffix: true });
              
              return (
                <div
                  key={discussion.id}
                  onClick={() => handleDiscussionClick(discussion.id)}
                  className="group bg-white rounded-xl border border-slate-200 hover:border-[#043658]/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      <Avatar
                        profileImage={discussion.author.profileImage}
                        name={authorName}
                        size="md"
                        className="flex-shrink-0 ring-2 ring-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-bold text-[#043658]">{authorName}</span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-500">{timeAgo}</span>
                            </div>
                            <h3 className="text-base font-bold text-slate-900 group-hover:text-[#043658] transition-colors line-clamp-1">
                              {discussion.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="px-2 py-1 bg-[#FFC107]/10 text-[#043658] text-[10px] font-bold rounded-full">
                              {discussion.replyCount} replies
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                          {discussion.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            {discussion.category && (
                              <span className="px-2.5 py-1 bg-slate-100 text-[#043658] text-[11px] font-semibold rounded-lg">
                                {discussion.category.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-xs text-slate-500">
                              <TrendingUp className="h-3 w-3" />
                              {discussion.views} views
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[#043658] group-hover:translate-x-1 transition-transform">
                            <span className="text-xs font-semibold">View</span>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enhanced right sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-0 h-fit space-y-4">
          {/* Active Users Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Active Now</h3>
              </div>
              <span className="text-xs text-green-600 font-semibold">17 online</span>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-[#043658] to-[#0a5c91] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 text-[10px] font-bold shadow-sm">
                +12
              </div>
            </div>
          </div>

          {/* Trending Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFC107]/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#FFC107]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Trending</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: 'New curriculum roll-out challenges', replies: 34, hot: true },
                { title: 'Best AI tools for grading essays', replies: 89, hot: true },
                { title: 'Parent-Teacher conference templates', replies: 24, hot: false },
              ].map((item, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-[#FFC107] mt-0.5">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 group-hover:text-[#043658] transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">{item.replies} replies</span>
                        {item.hot && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            Hot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Topics Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">#</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Popular Topics</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Mathematics', 'Science', 'Administration', 'Special Ed', 'Technology', 'Lesson Plans'].map((topic) => (
                <button
                  key={topic}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg hover:bg-[#043658] hover:text-white transition-all whitespace-nowrap"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {isModalOpen && (
        <StartDiscussionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleDiscussionCreated}
        />
      )}
    </div>
  );
}

// ─── Q&A Tab (embedded in community page) ────────────────────────────────────

function QuestionsTab({ isVerified }: { isVerified: boolean }) {
  const { token, isInitializing } = useAuth();
  const authReady = !isInitializing && !!token;

  const [statusFilter, setStatusFilter] = useState<QuestionFilter>("all");
  const [sort, setSort] = useState<QuestionSortKey>("newest");
  const [search, setSearch] = useState("");
  const [mine, setMine] = useState(false);
  const [page, setPage] = useState(1);
  const [showAskModal, setShowAskModal] = useState(false);

  const { data, isLoading, isError } = useQuestions({
    status: statusFilter,
    sort,
    search: search || undefined,
    mine,
    page,
    limit: 10,
    communityType: "NETWORK",
  });

  const questions = data?.data ?? [];
  const meta = data?.meta;

  const FILTERS: { label: string; value: QuestionFilter }[] = [
    { label: "All",    value: "all"    },
    { label: "Open",   value: "OPEN"   },
    { label: "Closed", value: "CLOSED" },
    { label: "Solved", value: "SOLVED" },
  ];

  return (
    <div className="mt-4 space-y-4">
      {/* Search + Ask */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
          <SearchIcon className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search questions…"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => {
            if (!isVerified) { window.dispatchEvent(new CustomEvent("show-verification-modal")); return; }
            setShowAskModal(true);
          }}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#032742] transition-colors"
        >
          <Plus className="h-4 w-4" /> Ask a Question
        </button>
      </div>

      {/* Status filters + sort */}
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

      {/* List */}
      <div className="space-y-3">
        {isLoading ? (
          [1,2,3].map((i) => <QSkeleton key={i} />)
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-700">
            Could not load questions. Please try again.
          </div>
        ) : questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center">
            <HelpCircle className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-semibold text-slate-700">
              {statusFilter !== "all" ? `No ${statusFilter.toLowerCase()} questions` : mine ? "You haven't asked any questions yet" : "No questions yet"}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {!mine && statusFilter === "all" ? "Be the first teacher to ask a question." : "Try a different filter."}
            </p>
            {isVerified && statusFilter === "all" && !mine && (
              <button
                onClick={() => setShowAskModal(true)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2 text-sm font-semibold text-white hover:bg-[#032742]"
              >
                <Plus className="h-4 w-4" /> Ask a Question
              </button>
            )}
          </div>
        ) : (
          questions.map((q) => (
            <Link key={q.id} href={`/community/questions/${q.id}`} className="group block outline-none">
              <article className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#043658]/40 hover:shadow-lg focus:ring-2 focus:ring-[#043658]/30">
                {/* Decorative background gradient */}
                <div className="absolute top-0 right-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-full bg-gradient-to-br from-blue-50 to-[#FFC107]/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-50" />
                
                <div className="relative flex items-start gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#043658] to-[#0a5c91] text-sm font-bold text-white shadow-inner">
                    {q.teacher.firstName[0]}{q.teacher.lastName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-800">
                        {q.teacher.firstName} {q.teacher.lastName}
                      </span>
                      <span className="text-[10px] font-bold rounded-full bg-[#043658]/10 px-2 py-0.5 text-[#043658]">
                        {String(q.teacher.level).replace(/^LEVEL_/, "L")}
                      </span>
                      <span className="text-xs font-medium text-slate-400 flex items-center gap-1 before:content-['•'] before:text-slate-300 before:mr-1">
                        {timeAgo(q.createdAt)}
                      </span>
                      <div className="ml-auto">
                        <QStatusBadge status={q.effectiveStatus} deadline={q.deadline} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#043658] transition-colors line-clamp-2 leading-snug">{q.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-500 line-clamp-2 leading-relaxed">{q.description}</p>

                    {/* Tags row */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        {q.category && (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-100">
                            <Tag className="h-3 w-3 text-slate-400" /> {q.category.name}
                          </span>
                        )}
                        
                        <div className="h-4 w-px bg-slate-200" />
                        
                        {q.effectiveStatus === "OPEN" ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                            <Lock className="h-3.5 w-3.5" />
                            {q.answerCount > 0
                              ? `${q.answerCount} answer${q.answerCount > 1 ? "s" : ""} securely hidden`
                              : "No answers yet — be the first!"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                            {q.answerCount} answer{q.answerCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {/* Explicit CTA */}
                      <span className="shrink-0 rounded-lg bg-[#043658]/8 px-3 py-1.5 text-[11px] font-bold text-[#043658] group-hover:bg-[#043658] group-hover:text-white transition-colors">
                        {q.effectiveStatus === "OPEN" ? "Answer →" : "View Answers →"}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
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

      {showAskModal && <AskQuestionModal onClose={() => setShowAskModal(false)} />}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "overview";
  const [tab, setTab]                     = useState<Tab>(initialTab);
  const [search, setSearch]               = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter]   = useState("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<"RESOURCE">("RESOURCE");
  const [discussionModalOpen, setDiscussionModalOpen] = useState(false);

  const { user, token, isInitializing } = useAuth();
  const { data: profile } = useProfile();
  const { status } = useVerification();
  const isVerified = status?.verificationStatus === "APPROVED";
  const authReady = !isInitializing && !!token;


  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: getCommunities,
    enabled: authReady,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    enabled: authReady,
  });

  const postType = TAB_POST_TYPE[tab];

  const postsQuery = useQuery({
    queryKey: ["community-feed", tab, search, communityFilter, categoryFilter],
    queryFn: async () => {
      const params: any = { page: 1, limit: 20 };
      if (search) params.search = search;
      if (communityFilter !== "all") params.communityId = communityFilter;
      if (categoryFilter !== "all") params.categoryId = categoryFilter;
      if (postType) params.postType = postType;
      const data = await getPosts(params);
      return Array.isArray(data) ? data : data ?? [];
    },
    enabled: authReady && !!postType,
    staleTime: 30_000,
  });

  const membersQuery = useQuery({
    queryKey: ["network-members"],
    queryFn: () => fetchMembersByType("network"),
    enabled: authReady && tab === "members",
    staleTime: 60_000,
  });

  const posts: any[] = postsQuery.data ?? [];
  const emptyState = EMPTY_STATE[tab];

  function handleCreatePost() {
    if (!isVerified) { window.dispatchEvent(new CustomEvent("show-verification-modal")); return; }
    setCreateModalType("RESOURCE");
    setCreateModalOpen(true);
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">

          {/* ── Community header ── */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">
                  ServeLink · Network Community
                </p>
                <h1 className="mt-1 font-['Lexend'] text-lg sm:text-xl font-semibold text-[#043658]">
                  Connect, collaborate and grow with educators nationwide.
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-green-700 font-medium">
                    ✓ Verified Teachers Only
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Open to all levels
                  </span>
                </div>
              </div>
              {/* Only show create button for discussions + resources here; questions has its own */}
              {(tab === "discussions" || tab === "resources") && (
                <button
                  onClick={() => {
                    if (!isVerified) { window.dispatchEvent(new CustomEvent("show-verification-modal")); return; }
                    if (tab === "discussions") {
                      setDiscussionModalOpen(true);
                    } else {
                      handleCreatePost();
                    }
                  }}
                  className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
                    isVerified ? "bg-[#043658] text-white hover:bg-[#032742]" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  {tab === "discussions" ? "Start Discussion" : "Share Resource"}
                </button>
              )}
            </div>
          </div>

          {/* ── Tabs ── */}
          <CommunityFilters
            tab={tab}
            setTab={setTab}
            search={search}
            setSearch={setSearch}
            communityFilter={communityFilter}
            setCommunityFilter={setCommunityFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            communities={communitiesQuery.data ?? []}
            categories={categoriesQuery.data ?? []}
          />

          {/* ── Tab content ── */}

          {tab === "overview" ? (
            <OverviewTab onTabChange={(t) => setTab(t as Tab)} />

          ) : tab === "discussions" ? (
            // ── Discussions embedded directly in the community page ──────────
            <DiscussionsTab isVerified={isVerified} />

          ) : tab === "questions" ? (
            // ── Full Q&A embedded directly in the community page ──────────
            <QuestionsTab isVerified={isVerified} />

          ) : tab === "members" ? (
            <div className="mt-4">
              <CommunityMembersTab
                members={membersQuery.data ?? []}
                isLoading={membersQuery.isLoading}
                isError={membersQuery.isError}
              />
            </div>

          ) : tab === "resources" ? (
            <div className="mt-4">
              {postsQuery.isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white">
                      <div className="h-32 rounded-t-xl bg-slate-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="h-3 w-full rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : postsQuery.isError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">Could not load resources.</div>
              ) : posts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
                  {emptyState.icon}
                  <p className="mt-3 text-sm font-semibold text-[#043658]">{emptyState.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{emptyState.message}</p>
                  {isVerified && (
                    <button onClick={handleCreatePost} className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-[#043658] px-5 py-2 text-sm font-semibold text-white hover:bg-[#032742]">
                      <Plus className="h-4 w-4" /> {emptyState.action}
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((r: any) => <ResourceCard key={r.id} resource={r} />)}
                </div>
              )}
            </div>

          ) : (
            // ── Discussions ───────────────────────────────────────────────
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="min-w-0 space-y-4">
                {postsQuery.isLoading ? (
                  [1,2,3].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-48 rounded bg-slate-200" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="h-4 w-full rounded bg-slate-200" />
                      </div>
                    </div>
                  ))
                ) : postsQuery.isError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">Could not load posts.</div>
                ) : posts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                    {emptyState.icon}
                    <p className="mt-3 text-sm font-semibold text-[#043658]">{emptyState.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{emptyState.message}</p>
                    {isVerified && emptyState.action && (
                      <button onClick={handleCreatePost} className="mt-4 flex items-center gap-2 mx-auto rounded-lg bg-[#043658] px-5 py-2 text-sm font-semibold text-white hover:bg-[#032742]">
                        <Plus className="h-4 w-4" /> {emptyState.action}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
                  </div>
                )}
              </div>
              <aside className="hidden lg:block">
                <div className="sticky top-0 h-fit">
                  <CommunitySideRail />
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      {/* Discussions / Resources modal */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultType={createModalType}
        communityType="NETWORK"
      />

      {discussionModalOpen && (
        <StartDiscussionModal
          isOpen={discussionModalOpen}
          onClose={() => setDiscussionModalOpen(false)}
          onSuccess={(id) => {
            setDiscussionModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
