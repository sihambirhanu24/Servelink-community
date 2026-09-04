"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Trophy, User, Medal, Loader2, AlertCircle, RefreshCw, Award, Users, TrendingUp, ChevronRight } from "lucide-react";
import { getTopContributors } from "@/services/community-network";
import type { TopContributor } from "@/services/community-network";

function levelLabel(raw?: string) {
  return String(raw ?? "LEVEL_1").replace(/^LEVEL_/, "L").replace(/_/g, "");
}

function getRankBadge(rank: number) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-[#FFC107] to-[#FFD54F] shadow-md">
        <Trophy className="w-4 h-4 text-[#043658]" strokeWidth={2.5} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-md">
        <Medal className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 shadow-md">
        <Medal className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100">
      <span className="text-xs font-semibold text-slate-600">#{rank}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded-full" />
          <div className="w-10 h-10 bg-slate-200 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-32" />
            <div className="h-3 bg-slate-200 rounded w-16" />
          </div>
          <div className="text-right space-y-1">
            <div className="h-4 bg-slate-200 rounded w-12 ml-auto" />
            <div className="h-3 bg-slate-200 rounded w-10 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, isInitializing, user } = useAuth();
  const authReady = !isInitializing && !!token;

  const { data: contributors = [], isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getTopContributors(50),
    enabled: authReady,
    staleTime: 2 * 60_000,
    retry: 3,
  });

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 h-[calc(100vh-4rem)] overflow-y-auto lg:ml-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4">
            <Link
              href="/community"
              className="flex items-center gap-1.5 text-slate-600 hover:text-[#043658] transition-colors"
            >
              <Users className="w-4 h-4" />
              <span className="font-medium">Community</span>
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-[#043658]">Leaderboard</span>
          </nav>

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#043658] flex items-center gap-3">
              <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFC107]" />
              Leaderboard
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600">
              Top contributors ranked by their total contribution points
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#043658]">
                    {isLoading ? "—" : contributors.length}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Contributors</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#043658]">
                    {isLoading ? "—" : contributors.length > 0 ? contributors[0].points : 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Top Score</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50">
                  <Trophy className="w-5 h-5 text-[#FFC107]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[#043658]">
                    {isLoading
                      ? "—"
                      : contributors.length > 0
                      ? Math.round(contributors.reduce((sum, c) => sum + c.points, 0) / contributors.length)
                      : 0}
                  </p>
                  <p className="text-sm text-slate-500 mt-1">Avg Points</p>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="text-lg font-semibold text-[#043658] flex items-center gap-2">
                <Award className="w-5 h-5" />
                Community Leaderboard
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Members ranked by contribution points
              </p>
            </div>

            {/* Content */}
            <div>
              {isInitializing || isLoading ? (
                <div className="p-4">
                  <LoadingSkeleton />
                </div>
              ) : error ? (
                <div className="p-12 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-red-300 mb-3" />
                  <p className="text-sm font-medium text-slate-700">Failed to load leaderboard</p>
                  <p className="text-xs text-slate-500 mt-1 mb-4">Please try again later</p>
                  <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#043658] rounded-lg hover:bg-[#032B46] transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : contributors.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No leaderboard data yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Start contributing to your community to appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {contributors.map((contributor, index) => {
                    const initials = `${contributor.firstName[0]}${contributor.lastName[0]}`;
                    const name = `${contributor.firstName} ${contributor.lastName}`;
                    const isTop3 = index < 3;
                    const isCurrentUser = user?.id === contributor.id;

                    return (
                      <div
                        key={contributor.id}
                        className={`flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-colors ${
                          isTop3 ? "bg-gradient-to-r from-slate-50/50 to-transparent" : "hover:bg-slate-50"
                        } ${isCurrentUser ? "ring-2 ring-inset ring-[#043658]/20 bg-blue-50/30" : ""}`}
                      >
                        {/* Rank Badge */}
                        <div className="flex-shrink-0">
                          {getRankBadge(contributor.rank)}
                        </div>

                        {/* Avatar */}
                        {contributor.profileImage ? (
                          <img
                            src={contributor.profileImage}
                            alt={name}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-slate-100"
                          />
                        ) : (
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-700 flex-shrink-0 ring-2 ring-slate-100">
                            {initials}
                          </div>
                        )}

                        {/* Name & Level */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm sm:text-base truncate ${
                                isTop3 ? "font-bold" : "font-semibold"
                              } text-slate-900`}
                            >
                              {name}
                            </p>
                            {isCurrentUser && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#043658] text-white">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{levelLabel(contributor.level)}</p>
                        </div>

                        {/* Points */}
                        <div className="text-right flex-shrink-0">
                          <p className={`text-base sm:text-lg font-bold text-[#043658]`}>
                            {contributor.points.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide">points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer Note */}
          {contributors.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                Rankings are based on total contribution points earned from posts, questions, answers, and community engagement.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
