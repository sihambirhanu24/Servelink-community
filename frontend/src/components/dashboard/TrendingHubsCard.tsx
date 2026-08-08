"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ChevronRight,
  GraduationCap,
  LucideIcon,
} from "lucide-react";
import api from "@/lib/axios";

interface Community {
  id: string;
  name: string;
  type: string;
  _count?: {
    communityMembers: number;
  };
}

interface Hub {
  id: string;
  icon: LucideIcon;
  name: string;
  memberCount: string;
}

async function getCommunities(): Promise<Community[]> {
  const { data } = await api.get("/community");

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.communities)) {
    return data.communities;
  }

  return [];
}

export function TrendingHubsCard() {
  const {
    data: communities = [],
    isLoading,
    isError,
  } = useQuery<Community[]>({
    queryKey: ["trending-communities"],
    queryFn: getCommunities,
  });

  const hubs: Hub[] = communities.slice(0, 5).map((community) => ({
    id: community.id,
    icon:
      community.type === "SCHOOL"
        ? GraduationCap
        : Building2,
    name: community.name,
    memberCount: `${
      community._count?.communityMembers ?? 0
    } members`,
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 font-['Lexend'] text-sm font-semibold text-[#043658]">
        Trending Communities
      </h3>

      {isLoading && (
        <p className="text-sm text-slate-500">
          Loading communities...
        </p>
      )}

      {isError && (
        <p className="text-sm text-red-600">
          Could not load communities.
        </p>
      )}

      {!isLoading && !isError && hubs.length === 0 && (
        <p className="text-sm text-slate-500">
          No communities available yet.
        </p>
      )}

      <div className="space-y-1">
        {hubs.map((hub) => (
          <Link
            key={hub.id}
            href={`/community/${hub.id}`}
            className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#043658]/8">
              <hub.icon className="h-4 w-4 text-[#043658]" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight text-[#043658]">
                {hub.name}
              </p>

              <p className="text-xs text-slate-400">
                {hub.memberCount}
              </p>
            </div>

            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}