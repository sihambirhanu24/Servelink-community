'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/axios';

export type AnalyticsRange = '7d' | '30d' | '90d' | '6m' | '1y';

interface ChartDataPoint {
  date: string;
  teachers: number;
  posts: number;
  engagement: number;
}

interface AnalyticsResponse {
  overview: {
    totalTeachers: number;
    teacherChange: number;
    activeCommunities: number;
    communityChange: number;
    totalPosts: number;
    postChange: number;
    avgEngagement: number;
    engagementChange: number;
  };
  engagement: {
    likes: number;
    comments: number;
    bookmarks: number;
    total: number;
    likesPercentage: string;
    commentsPercentage: string;
    bookmarksPercentage: string;
  };
  teacherGrowth: Array<{ name: string; value: number }>;
  communityCategories: Array<{
    name: string;
    count: number;
    percentage: string;
  }>;
  chartData: ChartDataPoint[];
  range: string;
}

export function useAdminAnalytics(range: AnalyticsRange = '30d') {
  return useQuery({
    queryKey: ['admin-analytics', range],
    queryFn: async () => {
      const { data } = await adminApi.get<AnalyticsResponse>('/admin/analytics', {
        params: { range },
      });
      return data;
    },
    staleTime: 60_000, // 1 minute
    retry: 2,
  });
}
