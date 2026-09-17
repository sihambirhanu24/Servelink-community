'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Heart, Download, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/layout';
import { API_URL } from '@/lib/config';

interface AnalyticsData {
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
  communityCategories: Array<{ name: string; count: number; percentage: string }>;
  range: string;
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/admin/analytics?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to load analytics');
      }

      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError('Failed to load analytics. Please try again.');
      toast.error('Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics) return;

    const csv = [
      ['ServeLink Platform Analytics', `Date Range: ${getRangeLabel(dateRange)}`],
      [''],
      ['OVERVIEW METRICS', ''],
      ['Total Teachers', analytics.overview.totalTeachers],
      ['Teacher Growth', `${analytics.overview.teacherChange > 0 ? '+' : ''}${analytics.overview.teacherChange}%`],
      ['Active Communities', analytics.overview.activeCommunities],
      ['Community Growth', `${analytics.overview.communityChange > 0 ? '+' : ''}${analytics.overview.communityChange}%`],
      ['Total Posts', analytics.overview.totalPosts],
      ['Post Growth', `${analytics.overview.postChange > 0 ? '+' : ''}${analytics.overview.postChange}%`],
      ['Average Engagement', analytics.overview.avgEngagement],
      [''],
      ['ENGAGEMENT BREAKDOWN', ''],
      ['Likes', analytics.engagement.likes],
      ['Comments', analytics.engagement.comments],
      ['Bookmarks', analytics.engagement.bookmarks],
      ['Total Engagements', analytics.engagement.total],
      [''],
      ['TEACHER GROWTH', ''],
      ['Period', 'Registrations'],
      ...analytics.teacherGrowth.map((g) => [g.name, g.value]),
      [''],
      ['COMMUNITY CATEGORIES', ''],
      ['Category', 'Count', 'Percentage'],
      ...analytics.communityCategories.map((c) => [c.name, c.count, `${c.percentage}%`]),
    ];

    const csvContent = csv.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `servelink-analytics-${dateRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported successfully!');
  };

  const getRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '90d': return 'Last 90 Days';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const getChangeType = (change: number): 'positive' | 'negative' | 'neutral' => {
    if (change > 0) return 'positive';
    if (change < 0) return 'negative';
    return 'neutral';
  };

  if (error && !analytics) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-red-600" />
          <p className="text-lg font-semibold text-[#043658]">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="flex items-center gap-2 rounded-lg bg-[#043658] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Platform Analytics</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">
              Performance and user engagement metrics for {getRangeLabel(dateRange).toLowerCase()}.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-medium text-[#043658] hover:border-[#043658]/40 disabled:opacity-50"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
            <button
              onClick={handleExport}
              disabled={isLoading || !analytics}
              className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
          </div>
        ) : analytics ? (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Teachers */}
              <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10 text-[#043658]">
                    <Users className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      getChangeType(analytics.overview.teacherChange) === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : getChangeType(analytics.overview.teacherChange) === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {analytics.overview.teacherChange > 0 ? '+' : ''}{analytics.overview.teacherChange}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#043658]">{analytics.overview.totalTeachers.toLocaleString()}</p>
                <p className="text-xs text-[#6B7C93] mt-1">Total Teachers</p>
              </div>

              {/* Active Communities */}
              <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10 text-[#043658]">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      getChangeType(analytics.overview.communityChange) === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : getChangeType(analytics.overview.communityChange) === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {analytics.overview.communityChange > 0 ? '+' : ''}{analytics.overview.communityChange}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#043658]">{analytics.overview.activeCommunities.toLocaleString()}</p>
                <p className="text-xs text-[#6B7C93] mt-1">Active Communities</p>
              </div>

              {/* Total Posts */}
              <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10 text-[#043658]">
                    <Heart className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      getChangeType(analytics.overview.postChange) === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : getChangeType(analytics.overview.postChange) === 'negative'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {analytics.overview.postChange > 0 ? '+' : ''}{analytics.overview.postChange}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#043658]">{analytics.overview.totalPosts.toLocaleString()}</p>
                <p className="text-xs text-[#6B7C93] mt-1">Total Posts</p>
              </div>

              {/* Avg Engagement */}
              <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10 text-[#043658]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    —
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#043658]">{analytics.overview.avgEngagement.toFixed(2)}</p>
                <p className="text-xs text-[#6B7C93] mt-1">Avg Engagement per Post</p>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Teacher Registration Growth */}
              <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#043658]">Teacher Registration Growth</h2>
                    <p className="text-xs text-[#6B7C93] mt-1">New user acquisition over {getRangeLabel(dateRange).toLowerCase()}</p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-[#6B7C93]" />
                </div>

                {analytics.teacherGrowth.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.teacherGrowth.map((point) => {
                      const maxValue = Math.max(...analytics.teacherGrowth.map((p) => p.value), 1);
                      return (
                        <div key={point.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#043658]">{point.name}</span>
                            <span className="text-sm font-bold text-[#043658]">{point.value}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#043658]"
                              style={{ width: `${(point.value / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-sm text-[#6B7C93]">
                    No registration data available for this period.
                  </div>
                )}
              </div>

              {/* Community Categories */}
              <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#043658]">Community Categories</h2>
                    <p className="text-xs text-[#6B7C93] mt-1">
                      Distribution across {analytics.overview.activeCommunities} total communities
                    </p>
                  </div>
                  <MessageSquare className="h-5 w-5 text-[#6B7C93]" />
                </div>

                {analytics.communityCategories.length > 0 ? (
                  <>
                    <div className="space-y-3">
                      {analytics.communityCategories.map((cat, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-[#043658]">{cat.name}</span>
                            <span className="text-sm font-bold text-[#043658]">{cat.percentage}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-purple-500' : idx === 2 ? 'bg-green-500' : 'bg-slate-500'
                              }`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E8EEF3] text-xs text-[#6B7C93]">
                      <p>
                        Total communities: <span className="font-bold text-[#043658]">{analytics.overview.activeCommunities}</span>
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8 text-sm text-[#6B7C93]">
                    No community category data available.
                  </div>
                )}
              </div>
            </div>

            {/* Engagement */}
            <div className="grid grid-cols-1 gap-6">
              {/* Post Engagement Types */}
              <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#043658]">Post Engagement Types</h2>
                    <p className="text-xs text-[#6B7C93] mt-1">Breakdown of likes, comments, and bookmarks</p>
                  </div>
                  <Heart className="h-5 w-5 text-[#6B7C93]" />
                </div>

                {analytics.engagement.total > 0 ? (
                  <>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#043658]">Likes</span>
                            <span className="text-xs text-[#6B7C93]">{analytics.engagement.likes.toLocaleString()}</span>
                          </div>
                          <span className="text-sm font-bold text-[#043658]">{analytics.engagement.likesPercentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{ width: `${analytics.engagement.likesPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#043658]">Comments</span>
                            <span className="text-xs text-[#6B7C93]">{analytics.engagement.comments.toLocaleString()}</span>
                          </div>
                          <span className="text-sm font-bold text-[#043658]">{analytics.engagement.commentsPercentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${analytics.engagement.commentsPercentage}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[#043658]">Bookmarks</span>
                            <span className="text-xs text-[#6B7C93]">{analytics.engagement.bookmarks.toLocaleString()}</span>
                          </div>
                          <span className="text-sm font-bold text-[#043658]">{analytics.engagement.bookmarksPercentage}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${analytics.engagement.bookmarksPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E8EEF3]">
                      <p className="text-sm font-bold text-[#043658]">
                        Total Engagements: {analytics.engagement.total.toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-8 text-sm text-[#6B7C93]">
                    No engagement data available.
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Metrics Table */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#043658] mb-4">Detailed Metrics</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8EEF3]">
                      <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Metric</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Current</th>
                      <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#043658]">Total Teachers</td>
                      <td className="px-4 py-3 font-bold text-[#043658]">{analytics.overview.totalTeachers.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            analytics.overview.teacherChange > 0
                              ? 'bg-green-100 text-green-700'
                              : analytics.overview.teacherChange < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {analytics.overview.teacherChange > 0 ? '+' : ''}{analytics.overview.teacherChange}%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#043658]">Active Communities</td>
                      <td className="px-4 py-3 font-bold text-[#043658]">{analytics.overview.activeCommunities.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            analytics.overview.communityChange > 0
                              ? 'bg-green-100 text-green-700'
                              : analytics.overview.communityChange < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {analytics.overview.communityChange > 0 ? '+' : ''}{analytics.overview.communityChange}%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#043658]">Total Posts</td>
                      <td className="px-4 py-3 font-bold text-[#043658]">{analytics.overview.totalPosts.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            analytics.overview.postChange > 0
                              ? 'bg-green-100 text-green-700'
                              : analytics.overview.postChange < 0
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {analytics.overview.postChange > 0 ? '+' : ''}{analytics.overview.postChange}%
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#043658]">Avg Engagement per Post</td>
                      <td className="px-4 py-3 font-bold text-[#043658]">{analytics.overview.avgEngagement.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">—</span>
                      </td>
                    </tr>
                    <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#043658]">Total Likes</td>
                      <td className="px-4 py-3 font-bold text-[#043658]">{analytics.engagement.likes.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">—</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 text-[#043658]">Total Comments</td>
                      <td className="px-4 py-3 font-bold text-[#043658]">{analytics.engagement.comments.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">—</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AdminLayout>
  );
}
