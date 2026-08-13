'use client';

import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data - in production, this would come from the backend
const mockChartData = [
  { date: 'Jan 1', teachers: 150, posts: 45, engagement: 120 },
  { date: 'Jan 8', teachers: 180, posts: 62, engagement: 145 },
  { date: 'Jan 15', teachers: 220, posts: 78, engagement: 180 },
  { date: 'Jan 22', teachers: 280, posts: 95, engagement: 220 },
  { date: 'Jan 29', teachers: 320, posts: 115, engagement: 260 },
  { date: 'Feb 5', teachers: 380, posts: 135, engagement: 310 },
];

type TimeRange = '7days' | '30days' | '90days';

export function PlatformActivityChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30days');

  // In production, fetch data based on timeRange
  const data = mockChartData;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-[#043658]">
            Teacher Growth & Post Engagement
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Platform adoption metrics over the last 30 days
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/50"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="teachers"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ fill: '#0ea5e9', r: 4 }}
              name="New Teachers"
            />
            <Line
              type="monotone"
              dataKey="posts"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ fill: '#fbbf24', r: 4 }}
              name="Posts"
            />
            <Line
              type="monotone"
              dataKey="engagement"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              name="Engagement"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
