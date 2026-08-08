"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Globe,
  GraduationCap,
  Lock,
  Loader2,
  Users,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Community {
  id: string;
  name: string;
  type: "SCHOOL" | "WOREDA" | "ZONE" | "REGION" | "NATIONAL";
  description?: string;
  school?: string;
  woreda?: string;
  zone?: string;
  region?: string;
  _count?: {
    communityMembers: number;
    posts: number;
  };
}

interface JoinedMembership {
  id: string;
  createdAt: string;
  status: string;
  community: Community;
}

/* ─── Level helpers ──────────────────────────────────────────────────────── */
const LEVEL_ORDER: Record<string, number> = {
  LEVEL_1: 1,
  LEVEL_2: 2,
  LEVEL_3: 3,
  LEVEL_4: 4,
  LEVEL_5: 5,
};

const TYPE_REQUIRED_LEVEL: Record<Community["type"], number> = {
  SCHOOL: 1,
  WOREDA: 2,
  ZONE: 3,
  REGION: 4,
  NATIONAL: 5,
};

const TYPE_ICON: Record<Community["type"], typeof GraduationCap> = {
  SCHOOL: GraduationCap,
  WOREDA: Building2,
  ZONE: Building2,
  REGION: Globe,
  NATIONAL: Globe,
};

const TYPE_LABEL: Record<Community["type"], string> = {
  SCHOOL: "School",
  WOREDA: "Woreda",
  ZONE: "Zone",
  REGION: "Regional",
  NATIONAL: "National",
};

/* ─── API fetchers ───────────────────────────────────────────────────────── */
async function getJoinedCommunities(): Promise<JoinedMembership[]> {
  const { data } = await api.get("/profile/communities");
  return data;
}

async function getAllCommunities(): Promise<Community[]> {
  const { data } = await api.get("/community");
  return Array.isArray(data) ? data : (data.communities ?? []);
}

async function getCurrentTeacher() {
  const { data } = await api.get("/auth/me");
  return data;
}

function useJoinCommunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (communityId: string) =>
      api.post(`/membership/${communityId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
      queryClient.invalidateQueries({ queryKey: ["all-communities"] });
      queryClient.invalidateQueries({ queryKey: ["my-communities-count"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

/* ─── Joined Community Card ──────────────────────────────────────────────── */
function JoinedCommunityCard({ membership }: { membership: JoinedMembership }) {
  const c = membership.community;
  const Icon = TYPE_ICON[c.type] ?? Building2;
  const memberCount = c._count?.communityMembers ?? 0;
  const joinedDate = new Date(membership.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-[#043658]/20 hover:shadow-md">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8 text-[#043658]">
          <Icon className="h-5 w-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-[#043658]">
              {c.name}
            </h4>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#043658]/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#043658]">
              {TYPE_LABEL[c.type]}
            </span>
            <span className="text-xs text-slate-400">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-400">Joined {joinedDate}</span>
          </div>

          {c.description && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
              {c.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          href={`/community/${c.id}`}
          id={`open-community-${c.id}`}
          className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#043658]/90"
        >
          <ExternalLink className="h-3 w-3" />
          Open Community
        </Link>
      </div>
    </div>
  );
}

/* ─── Available Community Card ───────────────────────────────────────────── */
function AvailableCommunityCard({
  community,
  teacherLevelNum,
}: {
  community: Community;
  teacherLevelNum: number;
}) {
  const Icon = TYPE_ICON[community.type] ?? Building2;
  const requiredLevel = TYPE_REQUIRED_LEVEL[community.type];
  const canJoin = teacherLevelNum >= requiredLevel;
  const memberCount = community._count?.communityMembers ?? 0;
  const { mutate: join, isPending } = useJoinCommunity();

  function handleJoin() {
    console.log(community.id);
    join(community.id, {
      
     onError: (err: any) => {
  console.log("Axios Error:", err);
  console.log("Response:", err.response?.data);
  console.log("Message:", err.response?.data?.message);
  console.log("Type:", typeof err.response?.data?.message);

  toast.error(
    typeof err.response?.data?.message === "string"
      ? err.response.data.message
      : "Failed to join community."
  );
}
    });
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        canJoin
          ? "border-slate-200 hover:border-[#043658]/20 hover:shadow-md"
          : "border-slate-100 opacity-75"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            canJoin ? "bg-[#043658]/8 text-[#043658]" : "bg-slate-100 text-slate-400"
          }`}
        >
          {canJoin ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="truncate text-sm font-semibold text-[#043658]">
            {community.name}
          </h4>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {TYPE_LABEL[community.type]}
            </span>
            <span className="text-xs text-slate-400">
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-xs text-slate-400">
              Level {requiredLevel} required
            </span>
          </div>

          {community.description && (
            <p className="mt-2 text-xs leading-relaxed text-slate-500 line-clamp-2">
              {community.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        {canJoin ? (
          <button
            id={`join-community-${community.id}`}
            onClick={handleJoin}
            disabled={isPending}
            className="flex items-center gap-1.5 rounded-lg bg-[#FFC107] px-3 py-1.5 text-xs font-semibold text-[#043658] transition hover:bg-[#ffd04a] disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Users className="h-3 w-3" />
            )}
            {isPending ? "Joining…" : "Join"}
          </button>
        ) : (
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400">
            <Lock className="h-3 w-3" />
            Requires LEVEL_{requiredLevel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Section skeleton ───────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-4 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
          <div className="h-3 w-3/4 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="h-6 w-24 rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function MyCommunitiesPage() {
  const { data: joined = [], isLoading: joinedLoading } = useQuery({
    queryKey: ["joined-communities"],
    queryFn: getJoinedCommunities,
  });

  const { data: allCommunities = [], isLoading: allLoading } = useQuery({
    queryKey: ["all-communities"],
    queryFn: getAllCommunities,
  });

  const { data: teacher } = useQuery({
    queryKey: ["current-teacher"],
    queryFn: getCurrentTeacher,
  });

  const teacherLevel: string = teacher?.level ?? "LEVEL_1";
  const teacherLevelNum = LEVEL_ORDER[teacherLevel] ?? 1;

  // IDs of communities already joined
  const joinedIds = new Set(joined.map((m) => m.community.id));

  // Available = not yet joined AND accessible to this teacher level
  const available = allCommunities.filter((c) => !joinedIds.has(c.id));

  const isLoading = joinedLoading || allLoading;

  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Back link */}
          <Link
            href="/community"
            className="mb-6 flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#043658] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Community
          </Link>

          {/* Page title */}
          <div className="mb-8">
            <h1 className="font-['Lexend'] text-2xl font-semibold text-[#043658]">
              My Communities
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your memberships and discover new communities.
            </p>
          </div>

          {/* ── Joined Communities ── */}
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-['Lexend'] text-sm font-semibold text-[#043658]">
                Joined Communities
              </h2>
              {!isLoading && (
                <span className="rounded-full bg-[#043658]/8 px-2.5 py-0.5 text-xs font-semibold text-[#043658]">
                  {joined.length}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : joined.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
                <Users className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  You haven&apos;t joined any communities yet.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Browse available communities below.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {joined.map((membership) => (
                  <JoinedCommunityCard
                    key={membership.id}
                    membership={membership}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Available Communities ── */}
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-['Lexend'] text-sm font-semibold text-[#043658]">
                Available Communities
              </h2>
              {!isLoading && (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                  {available.length}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : available.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="mt-3 text-sm font-medium text-slate-500">
                  You&apos;re already a member of every community available to your level.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {available.map((community) => (
                  <AvailableCommunityCard
                    key={community.id}
                    community={community}
                    teacherLevelNum={teacherLevelNum}
                  />
                ))}
              </div>
            )}
          </section>

        </div>
      </main>
    </div>
  );
}
