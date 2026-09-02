"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Trophy, User, TrendingUp, Medal, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { getTopContributors } from "@/services/community-network";
import type { TopContributor } from "@/services/community-network";

function levelLabel(raw?: string) {
  return String(raw ?? "LEVEL_1").replace(/^LEVEL_/, "L").replace(/_/g, "");
}

function getRankBadge(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-[#FFC107]" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-xs font-bold text-slate-500">#{rank}</span>;
}

export default function LeaderboardPage() {
  const { token, isInitializing, user } = useAuth();
  const authReady = !isInitializing && !!token;

  const { data: contributors = [], isLoading, error, refetch } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => getTopContributors(50),
    enabled: authReady,
    staleTime: 2 * 60_000,
    retry: 3,
  });

  if (isInitializing || isLoading) {
    return (
      <div className="flex h-screen bg-[#F5F8FB] overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 min-w-0 overflow-y-auto">
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#043658]" />
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F8FB] overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="w-full max-w-[1280px] mx-auto px-6 py-6" style={{ width: 'calc(100% - 48px)' }}>
            {/* Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex items-center gap-4">
                <Link
                  href="/community/network"
                  className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#043658]"
                >
                  <Trophy className="w-4 h-4" />
                  Network Community
                </Link>
                <span className="text-slate-300">/</span>
                <h1 className="text-lg font-bold text-[#043658]">Leaderboard</h1>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Top contributors ranked by their total contribution points
              </p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-[#043658]">{contributors.length}</p>
                <p className="text-xs text-slate-500">Contributors</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-[#043658]">
                  {contributors.length > 0 ? contributors[0].points : 0}
                </p>
                <p className="text-xs text-slate-500">Top Score</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
                <p className="text-2xl font-bold text-[#043658]">
                  {contributors.length > 0 ? Math.round(contributors.reduce((sum, c) => sum + c.points, 0) / contributors.length) : 0}
                </p>
                <p className="text-xs text-slate-500">Avg Points</p>
              </div>
            </div>

            {/* Leaderboard List */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {error ? (
                <div className="p-12 text-center">
                  <AlertCircle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">Failed to load leaderboard</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">Please try again later</p>
                  <button
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#043658] bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </button>
                </div>
              ) : contributors.length === 0 ? (
                <div className="p-12 text-center">
                  <User className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <p className="text-sm text-slate-500">No contributors yet</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to contribute!</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {contributors.map((contributor, index) => {
                    const initials = `${contributor.firstName[0]}${contributor.lastName[0]}`;
                    const name = `${contributor.firstName} ${contributor.lastName}`;
                    const isTop3 = index < 3;
                    const bgColor = isTop3 ? 'bg-[#f0f5fa]' : '';
                    const isCurrentUser = user?.id === contributor.id;
                    
                    return (
                      <div
                        key={contributor.id}
                        className={`flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors ${bgColor} ${isCurrentUser ? 'border-l-4 border-l-[#043658]' : ''}`}
                      >
                        {/* Rank */}
                        <div className="w-8 flex justify-center">
                          {getRankBadge(contributor.rank)}
                        </div>

                        {/* Avatar */}
                        {contributor.profileImage ? (
                          <img
                            src={contributor.profileImage}
                            alt={name}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                            {initials}
                          </div>
                        )}

                        {/* Name & Level */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {name}
                            {isCurrentUser && <span className="ml-2 text-xs font-normal text-[#043658]">(You)</span>}
                          </p>
                          <p className="text-xs text-slate-500">{levelLabel(contributor.level)}</p>
                        </div>

                        {/* Points */}
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#043658]">{contributor.points}</p>
                          <p className="text-[10px] text-slate-400">points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-400">
                Rankings are based on total contribution points earned from posts, questions, answers, and community engagement.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
