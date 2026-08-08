"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  GraduationCap,
  Globe,
  Lock,
  Search,
  LucideIcon,
} from "lucide-react";

import api from "@/lib/axios";
import Link from "next/link";

interface Tier {
  id: string;
  icon: LucideIcon;
  name: string;
  description: string;
  unlocked: boolean;
  requiredLevel: number;
}

async function getCommunities() {
  const { data } = await api.get("/community");
  return data.communities;
}

async function getTeacher() {
  const { data } = await api.get("/auth/me");
  return data;
}

interface ExpandedContentProps {
  tier: Tier;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  visibleCommunities: any[];
  isLoading: boolean;
}

export function ExpandedContent({
  tier,
  searchQuery,
  setSearchQuery,
  visibleCommunities,
  isLoading,
}: ExpandedContentProps) {
  return (
    <div className="mt-4 border border-slate-200 bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h4 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
            {tier.name} Directory
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Search and collaborate in this tier
          </p>
        </div>
        
        {/* Search input immediately above the community list */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search communities...`}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-[#F7F9FC] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658] transition"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Loading communities...
        </div>
      ) : visibleCommunities.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
          {searchQuery ? "No matches found in this tier." : "No communities available in this tier."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleCommunities.map((community: any) => (
            <Link
              key={community.id}
              href={`/community/${community.id}`}
              className="block rounded-xl border border-slate-200 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#043658]/30 hover:bg-[#F5F9FD]/50 hover:shadow-sm"
            >
              <h5 className="font-semibold text-[#043658] text-sm truncate">
                {community.name}
              </h5>
              
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>{community._count?.communityMembers ?? 0} members</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span>{community._count?.posts ?? 0} posts</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function CommunityAccessCard() {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: communities = [], isLoading } = useQuery({
    queryKey: ["community-access"],
    queryFn: getCommunities,
  });

  const { data: teacher } = useQuery({
    queryKey: ["current-teacher"],
    queryFn: getTeacher,
  });

  const teacherLevel = teacher?.level;

  const tiers: Tier[] = [
    {
      id: "school",
      icon: GraduationCap,
      name: "School Community",
      description: "Connect with peers at your school.",
      unlocked: true,
      requiredLevel: 1,
    },
    {
      id: "woreda",
      icon: Building2,
      name: "Woreda Community",
      description: "Connect with teachers in your woreda.",
      unlocked:
        teacherLevel === "LEVEL_2" ||
        teacherLevel === "LEVEL_3" ||
        teacherLevel === "LEVEL_4" ||
        teacherLevel === "LEVEL_5",
      requiredLevel: 2,
    },
    {
      id: "zone",
      icon: Building2,
      name: "Zone Community",
      description: "Connect with teachers in your zone.",
      unlocked:
        teacherLevel === "LEVEL_3" ||
        teacherLevel === "LEVEL_4" ||
        teacherLevel === "LEVEL_5",
      requiredLevel: 3,
    },
    {
      id: "region",
      icon: Globe,
      name: "Regional Community",
      description: "Regional collaboration.",
      unlocked:
        teacherLevel === "LEVEL_4" ||
        teacherLevel === "LEVEL_5",
      requiredLevel: 4,
    },
    {
      id: "national",
      icon: Lock,
      name: "National Community",
      description: "National collaboration.",
      unlocked: teacherLevel === "LEVEL_5",
      requiredLevel: 5,
    },
  ];

  // Filtering search within the expanded category only
  const filteredCommunities = communities.filter(
    (community: any) =>
      community.type.toLowerCase() === expandedTier &&
      (searchQuery.trim() === "" ||
        community.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <h3 className="mb-4 font-['Lexend'] text-sm font-semibold text-[#043658]">
        Community Access
      </h3>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {/* On smaller screens we stack, on xl we can do 2 cols grid */}
        {tiers.map((tier) => {
          const isSelected = expandedTier === tier.id;
          const isLocked = !tier.unlocked;
          const communityCount = communities.filter(
            (c: any) => c.type.toLowerCase() === tier.id
          ).length;

          return (
            <div key={tier.id} className="flex flex-col">
              <button
                type="button"
                aria-expanded={isSelected}
                onClick={() => {
                  if (isLocked) return;
                  setExpandedTier(isSelected ? null : tier.id);
                  setSearchQuery("");
                }}
                className={`group relative rounded-2xl border p-5 text-left transition-all duration-300 ease-in-out hover:-translate-y-0.5
                  ${
                    isSelected
                      ? "border-[#043658] bg-[#F5F9FD] ring-2 ring-[#043658]/10 shadow-md"
                      : "border-slate-200 bg-white"
                  }
                  ${
                    isLocked
                      ? "opacity-75 cursor-not-allowed border-slate-100 bg-slate-50/50"
                      : "hover:shadow-md cursor-pointer"
                  }
                `}
              >
                {/* Availability / Locked Badge */}
                <div className="absolute right-4 top-4">
                  {!isLocked ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      AVAILABLE
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                      LOCKED
                    </span>
                  )}
                </div>

                {/* Icon wrapper */}
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition duration-300
                  ${
                    isSelected
                      ? "bg-[#043658]/10 text-[#043658]"
                      : isLocked
                      ? "bg-slate-100 text-slate-400"
                      : "bg-slate-50 text-[#043658]"
                  }
                `}
                >
                  <tier.icon className="h-5 w-5" />
                </div>

                <p className="mt-4 text-sm font-semibold text-[#043658]">
                  {tier.name}
                </p>

                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
                  {tier.description}
                </p>

                {/* Available Count or Lock requirement */}
                {!isLocked ? (
                  <p className="mt-4 text-xs font-medium text-[#043658]/70">
                    {communityCount}{" "}
                    {communityCount === 1 ? "community" : "communities"}{" "}
                    available
                  </p>
                ) : (
                  <p className="mt-4 text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                    <span>🔒</span> Reach Teacher Level {tier.requiredLevel} to
                    unlock this community.
                  </p>
                )}
              </button>

              {/* Mobile/Stacked view expanded content - renders directly beneath the card */}
              <div
                className={`lg:hidden grid transition-all duration-300 ease-in-out ${
                  isSelected
                    ? "grid-rows-[1fr] opacity-100 mt-2"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <ExpandedContent
                    tier={tier}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    visibleCommunities={filteredCommunities}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/Grid view expanded content - renders below the entire grid */}
      <div
        className={`hidden lg:grid transition-all duration-300 ease-in-out ${
          expandedTier
            ? "grid-rows-[1fr] opacity-100 mt-6"
            : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {expandedTier && (
            <ExpandedContent
              tier={tiers.find((t) => t.id === expandedTier)!}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              visibleCommunities={filteredCommunities}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}