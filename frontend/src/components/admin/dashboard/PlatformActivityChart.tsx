'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { useAdminAnalytics, type AnalyticsRange } from '@/hooks/useAdminAnalytics';
import { ChartSkeleton } from './ChartSkeleton';

const RANGE_LABELS: Record<AnalyticsRange, string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '6m': 'Last 6 Months',
  '1y': 'Last 12 Months',
};

export function PlatformActivityChart() {
  const [range, setRange] = useState<AnalyticsRange>('30d');
  const { data: analyticsData, isLoading, isError, refetch } = useAdminAnalytics(range);

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Unable to load analytics data
            </p>
            <p className="mt-1 text-xs text-slate-500">
              There was an error loading the chart data.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <ChartSkeleton />;
  }

  const chartData = analyticsData?.chartData || [];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#043658]">
            Teacher Growth & Post Engagement
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Platform adoption metrics over {RANGE_LABELS[range].toLowerCase()}
          </p>
        </div>
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as AnalyticsRange)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/50"
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="6m">Last 6 Months</option>
          <option value="1y">Last 12 Months</option>
        </select>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-80 w-full items-center justify-center text-center">
          <div>
            <p className="text-sm font-medium text-slate-600">No data available</p>
            <p className="mt-1 text-xs text-slate-500">
              There is no activity data for the selected period.
            </p>
          </div>
        </div>
      ) : (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
                labelStyle={{
                  fontWeight: 600,
                  marginBottom: '0.25rem',
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '0.875rem' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="teachers"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', r: 4 }}
                activeDot={{ r: 6 }}
                name="New Teachers"
              />
              <Line
                type="monotone"
                dataKey="posts"
                stroke="#fbbf24"
                strokeWidth={2}
                dot={{ fill: '#fbbf24', r: 4 }}
                activeDot={{ r: 6 }}
                name="Posts"
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="Engagement"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
