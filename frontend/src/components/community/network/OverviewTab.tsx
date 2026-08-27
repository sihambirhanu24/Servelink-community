"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  Users, BookOpen, MessageCircle, FileText, HelpCircle,
  CheckCircle2, Clock, TrendingUp, ChevronRight, Star,
} from "lucide-react";
import { getNetworkOverview, getGuidelines } from "@/services/community-network";
import type { NetworkPost, CommunityGuideline } from "@/services/community-network";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levelLabel(raw?: string) {
  return String(raw ?? "LEVEL_1").replace(/^LEVEL_/, "L").replace(/_/g, "");
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex gap-2">
        <div className="h-7 w-7 rounded-full bg-slate-200" />
        <div className="space-y-1 flex-1">
          <div className="h-3 w-24 rounded bg-slate-200" />
          <div className="h-3 w-16 rounded bg-slate-200" />
        </div>
      </div>
      <div className="h-4 w-3/4 rounded bg-slate-200" />
      <div className="h-3 w-full rounded bg-slate-200" />
    </div>
  );
}

// ─── Post card (compact) ─────────────────────────────────────────────────────

function PostMiniCard({ post, icon }: { post: NetworkPost; icon: React.ReactNode }) {
  const name = `${post.teacher.firstName} ${post.teacher.lastName}`;
  return (
    <Link
      href={`/community/post/${post.id}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[#043658]/30 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658]/10 text-[#043658]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-[#043658] line-clamp-2 group-hover:underline">
            {post.title}
          </h4>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">{post.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <div className="h-4 w-4 rounded-full bg-[#043658]/10 flex items-center justify-center text-[8px] font-bold text-[#043658]">
                {post.teacher.firstName[0]}
              </div>
              {name}
              <span className="rounded-full bg-[#043658]/8 px-1.5 py-0.5 text-[9px] font-semibold text-[#043658]">
                {levelLabel(post.teacher.level)}
              </span>
            </span>
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" /> {timeAgo(post.createdAt)}
            </span>
            <span className="flex items-center gap-0.5">
              <MessageCircle className="h-3 w-3" /> {post._count.comments}
            </span>
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3" /> {post._count.communityLikes}
            </span>
            {post.isResolved && (
              <span className="flex items-center gap-0.5 text-green-600">
                <CheckCircle2 className="h-3 w-3" /> Resolved
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-[#043658] transition-colors" />
      </div>
    </Link>
  );
}

// ─── Guideline card ──────────────────────────────────────────────────────────

function GuidelineCard({ g }: { g: CommunityGuideline }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
      {g.icon && <span className="text-xl shrink-0">{g.icon}</span>}
      <div>
        <p className="text-sm font-semibold text-[#043658]">{g.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{g.description}</p>
      </div>
    </div>
  );
}

// ─── Stats card ──────────────────────────────────────────────────────────────

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-[#043658]">{icon}</span>
      <div>
        <p className="text-lg font-bold text-[#043658]">{value.toLocaleString()}</p>
        <p className="text-[10px] font-medium text-slate-500">{label}</p>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

interface OverviewTabProps {
  stats?: { members: number; questions: number; discussions: number; resources: number };
  onTabChange?: (tab: string) => void;
}

export function OverviewTab({ onTabChange }: OverviewTabProps) {
  const { token, isInitializing } = useAuth();
  const authReady = !isInitializing && !!token;

  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["network-overview"],
    queryFn: getNetworkOverview,
    enabled: authReady,
    staleTime: 60_000,
  });

  const { data: guidelines = [], isLoading: guidelinesLoading } = useQuery({
    queryKey: ["community-guidelines"],
    queryFn: getGuidelines,
    staleTime: 5 * 60_000,
  });

  const stats = overview?.stats;

  return (
    <div className="mt-4 space-y-6">
      {/* ── Stats row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {overviewLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-slate-100" />
          ))
        ) : (
          <>
            <StatPill icon={<Users className="h-5 w-5" />} value={stats?.members ?? 0} label="Members" />
            <StatPill icon={<HelpCircle className="h-5 w-5" />} value={stats?.questions ?? 0} label="Questions" />
            <StatPill icon={<MessageCircle className="h-5 w-5" />} value={stats?.discussions ?? 0} label="Discussions" />
            <StatPill icon={<FileText className="h-5 w-5" />} value={stats?.resources ?? 0} label="Resources" />
          </>
        )}
      </div>

      {/* ── Main 2-col grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

        {/* Left: Questions + Discussions + Resources */}
        <div className="space-y-6">

          {/* Recent Questions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#043658]">
                <HelpCircle className="h-5 w-5 text-[#FFC107]" />
                Recent Questions
              </h2>
              <button
                onClick={() => onTabChange?.("questions")}
                className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {overviewLoading
                ? [1, 2, 3].map((i) => <CardSkeleton key={i} />)
                : overview?.recentQuestions.length === 0
                ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                    <HelpCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No questions yet. Be the first to ask!</p>
                  </div>
                )
                : overview?.recentQuestions.map((q) => (
                  <PostMiniCard key={q.id} post={q} icon={<HelpCircle className="h-4 w-4" />} />
                ))}
            </div>
          </div>

          {/* Recent Discussions */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#043658]">
                <MessageCircle className="h-5 w-5 text-blue-500" />
                Recent Discussions
              </h2>
              <button
                onClick={() => onTabChange?.("discussions")}
                className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {overviewLoading
                ? [1, 2].map((i) => <CardSkeleton key={i} />)
                : overview?.recentDiscussions.length === 0
                ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                    <MessageCircle className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No discussions yet. Start a conversation!</p>
                  </div>
                )
                : overview?.recentDiscussions.map((d) => (
                  <PostMiniCard key={d.id} post={d} icon={<MessageCircle className="h-4 w-4" />} />
                ))}
            </div>
          </div>

          {/* Featured Resources */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold text-[#043658]">
                <FileText className="h-5 w-5 text-emerald-500" />
                Featured Resources
              </h2>
              <button
                onClick={() => onTabChange?.("resources")}
                className="flex items-center gap-1 text-xs font-medium text-[#043658] hover:underline"
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {overviewLoading
                ? [1, 2].map((i) => <CardSkeleton key={i} />)
                : overview?.recentResources.length === 0
                ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">No resources yet. Share something helpful!</p>
                  </div>
                )
                : overview?.recentResources.map((r) => (
                  <PostMiniCard key={r.id} post={r} icon={<FileText className="h-4 w-4" />} />
                ))}
            </div>
          </div>
        </div>

        {/* Right: Guidelines + Quick Actions */}
        <div className="space-y-5">

          {/* Community Guidelines */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-[#043658]">
              <BookOpen className="h-5 w-5 text-[#FFC107]" />
              Community Guidelines
            </h2>
            <div className="space-y-3">
              {guidelinesLoading
                ? [1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))
                : guidelines.length === 0
                ? (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No guidelines configured yet.
                  </p>
                )
                : guidelines.map((g) => <GuidelineCard key={g.id} g={g} />)
              }
            </div>
          </div>

          {/* Trending indicator */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[#043658]">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Network Activity
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              The Network Community connects verified teachers across ServeLink with no geographic restrictions.
              Ask questions, share resources, and collaborate with educators nationwide.
            </p>
            <div className="mt-4 rounded-lg bg-[#043658]/5 border border-[#043658]/10 p-3 text-xs text-[#043658]">
              <span className="font-semibold">Open to all verified teachers.</span>{" "}
              No school, woreda, zone, region or subject restriction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
