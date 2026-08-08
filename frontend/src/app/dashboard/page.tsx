'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { useDashboard } from '@/hooks/useDashboard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { DashboardLevelCard } from '@/components/dashboard/DashboardLevelCard';
import { DashboardStatsRow } from '@/components/dashboard/DashboardStatsRow';
import { DashboardRecentPosts } from '@/components/dashboard/DashboardRecentPosts';
import { DashboardCommunityFeed } from '@/components/dashboard/DashboardCommunityFeed';
import { DashboardRecentActivity } from '@/components/dashboard/DashboardRecentActivity';
import { DashboardSuggestedCommunities } from '@/components/dashboard/DashboardSuggestedCommunities';
import { TrendingHubsCard } from '@/components/dashboard/TrendingHubsCard';

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useDashboard();

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
          <AlertCircle className="h-6 w-6 text-slate-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Couldn&apos;t load your dashboard.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Check your connection and try again.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (!data.teacher) {
    if (typeof window !== 'undefined') {
      router.replace('/admin');
    }
    return null;
  }

  const { teacher, stats, recentPosts, communityFeed, recentNotifications, suggestedCommunities, communityAccess } = data;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">

      {/* ── Left column ── */}
      <div className="space-y-4 min-w-0">

        <DashboardLevelCard
          teacher={teacher}
          communityAccess={communityAccess}
        />

        <DashboardStatsRow stats={stats} />

        <DashboardRecentPosts posts={recentPosts} />

        <DashboardCommunityFeed posts={communityFeed} />

      </div>

      {/* ── Right column ── */}
      <div className="space-y-4 min-w-0">

        <DashboardRecentActivity notifications={recentNotifications} />

        <DashboardSuggestedCommunities communities={suggestedCommunities} />

        <TrendingHubsCard />

      </div>

    </div>
  );
}
