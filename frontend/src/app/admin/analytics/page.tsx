'use client';

import { useState } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Heart, Share2, Download, Calendar } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';

interface AnalyticsCard {
  label: string;
  value: string | number;
  change: number;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
}

interface ChartDataPoint {
  name: string;
  value: number;
}

interface RegionData {
  name: string;
  activeCount: number;
  percentage: string;
  trend: number;
}

const analyticsCards: AnalyticsCard[] = [
  {
    label: 'Total Teachers',
    value: '12,450',
    change: 14.2,
    changeType: 'positive',
    icon: <Users className="h-5 w-5" />,
  },
  {
    label: 'Active Communities',
    value: '842',
    change: 3.1,
    changeType: 'positive',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: 'Total Posts',
    value: '145.2k',
    change: -2.4,
    changeType: 'negative',
    icon: <Heart className="h-5 w-5" />,
  },
  {
    label: 'Avg Engagement',
    value: '6.8%',
    change: -1.2,
    changeType: 'negative',
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

const teacherRegistrationData: ChartDataPoint[] = [
  { name: 'Jan', value: 2400 },
  { name: 'Feb', value: 3210 },
  { name: 'Mar', value: 2290 },
  { name: 'Apr', value: 3221 },
  { name: 'May', value: 3500 },
  { name: 'Jun', value: 4100 },
];

const regionData: RegionData[] = [
  { name: 'North America', activeCount: 4230, percentage: '34%', trend: 12 },
  { name: 'Europe', activeCount: 3100, percentage: '25%', trend: 8 },
  { name: 'Asia Pacific', activeCount: 3050, percentage: '24%', trend: 18 },
  { name: 'Latin America', activeCount: 1560, percentage: '13%', trend: 5 },
  { name: 'Africa & ME', activeCount: 510, percentage: '4%', trend: 22 },
];

const engagementData = [
  { type: 'Likes', count: 45230, percentage: 45 },
  { type: 'Comments', count: 32450, percentage: 33 },
  { type: 'Shares', count: 22180, percentage: 22 },
];

const communityCategoriesData = [
  { name: 'STEM Sciences', percentage: 45, count: 378 },
  { name: 'Creative Arts', percentage: 30, count: 252 },
  { name: 'Humanities', percentage: 15, count: 126 },
  { name: 'Other', percentage: 10, count: 84 },
];

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30days');

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Platform Analytics</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Performance and user engagement metrics for the last 30 days.</p>
          </div>
          <div className="flex gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-medium text-[#043658] hover:border-[#043658]/40"
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
            <button className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] bg-white px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {analyticsCards.map((card, idx) => (
            <div key={idx} className="rounded-lg border border-[#D9E2EC] bg-white p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#043658]/10 text-[#043658]">
                  {card.icon}
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    card.changeType === 'positive'
                      ? 'bg-green-100 text-green-700'
                      : card.changeType === 'negative'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {card.changeType === 'positive' ? '+' : ''}{card.change}%
                </span>
              </div>
              <p className="text-2xl font-bold text-[#043658]">{card.value}</p>
              <p className="text-xs text-[#6B7C93] mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Teacher Registration Growth */}
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#043658]">Teacher Registration Growth</h2>
                <p className="text-xs text-[#6B7C93] mt-1">New user acquisition over the last 6 months</p>
              </div>
              <BarChart3 className="h-5 w-5 text-[#6B7C93]" />
            </div>

            {/* Simple Bar Chart Simulation */}
            <div className="space-y-4">
              {teacherRegistrationData.map((point) => (
                <div key={point.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#043658]">{point.name}</span>
                    <span className="text-sm font-bold text-[#043658]">{point.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#043658]"
                      style={{ width: `${(point.value / 4100) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Categories */}
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#043658]">Community Categories</h2>
                <p className="text-xs text-[#6B7C93] mt-1">Distribution across 842 total communities</p>
              </div>
              <MessageSquare className="h-5 w-5 text-[#6B7C93]" />
            </div>

            <div className="space-y-3">
              {communityCategoriesData.map((cat, idx) => (
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
              <p>Total communities: <span className="font-bold text-[#043658]">840</span></p>
            </div>
          </div>
        </div>

        {/* Engagement & Regional Data */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Post Engagement Types */}
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#043658]">Post Engagement Types</h2>
                <p className="text-xs text-[#6B7C93] mt-1">Breakdown of likes, comments, and shares per week</p>
              </div>
              <Heart className="h-5 w-5 text-[#6B7C93]" />
            </div>

            <div className="space-y-3">
              {engagementData.map((eng) => (
                <div key={eng.type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#043658]">{eng.type}</span>
                      <span className="text-xs text-[#6B7C93]">{eng.count.toLocaleString()}</span>
                    </div>
                    <span className="text-sm font-bold text-[#043658]">{eng.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        eng.type === 'Likes'
                          ? 'bg-red-500'
                          : eng.type === 'Comments'
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${eng.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E8EEF3]">
              <p className="text-sm font-bold text-[#043658]">Total Engagements: {engagementData.reduce((sum, e) => sum + e.count, 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Activity by Region */}
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#043658]">Activity by Region</h2>
                <p className="text-xs text-[#6B7C93] mt-1">Active users distribution across regions</p>
              </div>
              <Users className="h-5 w-5 text-[#6B7C93]" />
            </div>

            <div className="space-y-3">
              {regionData.map((region) => (
                <div key={region.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#043658]">{region.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#043658]">{region.activeCount.toLocaleString()}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${region.trend > 10 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        +{region.trend}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#043658]"
                      style={{ width: region.percentage }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Previous</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Change</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#043658]">Total Teachers</td>
                  <td className="px-4 py-3 font-bold text-[#043658]">12,450</td>
                  <td className="px-4 py-3 text-[#043658]">10,905</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">+14.2%</span></td>
                </tr>
                <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#043658]">Active Communities</td>
                  <td className="px-4 py-3 font-bold text-[#043658]">842</td>
                  <td className="px-4 py-3 text-[#043658]">817</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">+3.1%</span></td>
                </tr>
                <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#043658]">Total Posts</td>
                  <td className="px-4 py-3 font-bold text-[#043658]">145,234</td>
                  <td className="px-4 py-3 text-[#043658]">148,850</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">-2.4%</span></td>
                </tr>
                <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#043658]">Avg Engagement Rate</td>
                  <td className="px-4 py-3 font-bold text-[#043658]">6.8%</td>
                  <td className="px-4 py-3 text-[#043658]">6.9%</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">-1.2%</span></td>
                </tr>
                <tr className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#043658]">New User Registrations</td>
                  <td className="px-4 py-3 font-bold text-[#043658]">1,545</td>
                  <td className="px-4 py-3 text-[#043658]">1,350</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">+14.4%</span></td>
                </tr>
                <tr className="hover:bg-[#F8FAFC]">
                  <td className="px-4 py-3 text-[#043658]">Platform Activity Score</td>
                  <td className="px-4 py-3 font-bold text-[#043658]">8.2/10</td>
                  <td className="px-4 py-3 text-[#043658]">7.9/10</td>
                  <td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">+3.8%</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
