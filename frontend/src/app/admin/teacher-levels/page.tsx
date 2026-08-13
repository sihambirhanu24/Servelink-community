'use client';

import { useState } from 'react';
import { Plus, ChevronRight, Star, TrendingUp, Users, BarChart3, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';

interface LevelRequirement {
  label: string;
  description: string;
  met: boolean;
}

interface TeacherLevel {
  level: number;
  title: string;
  icon: string;
  teachers: number;
  requirements: LevelRequirement[];
  avgEngagementScore: number;
  prerequisites?: string[];
}

// Mock data for demonstration
const TEACHER_LEVELS: TeacherLevel[] = [
  {
    level: 1,
    title: 'Novice',
    icon: '⭐',
    teachers: 3420,
    avgEngagementScore: 45,
    requirements: [
      { label: 'Active Account', description: 'Maintain active status on platform', met: true },
      { label: 'Profile Completion', description: '100% profile information filled', met: true },
      { label: 'Community Participation', description: 'Join at least 1 community', met: true },
    ],
  },
  {
    level: 2,
    title: 'Practitioner',
    icon: '⭐⭐',
    teachers: 2850,
    avgEngagementScore: 62,
    prerequisites: ['Level 1'],
    requirements: [
      { label: '3+ Months Active', description: '3 consecutive months of platform engagement', met: true },
      { label: '10+ Posts', description: 'Minimum 10 community posts', met: true },
      { label: '50+ Positive Feedback', description: 'Receive 50+ positive community feedback', met: false },
    ],
  },
  {
    level: 3,
    title: 'Professional',
    icon: '⭐⭐⭐',
    teachers: 1920,
    avgEngagementScore: 76,
    prerequisites: ['Level 2'],
    requirements: [
      { label: '6+ Months Active', description: '6 months of consistent engagement', met: true },
      { label: '50+ Posts', description: 'Minimum 50 community posts', met: true },
      { label: '95%+ Positive Feedback', description: '95% positive community feedback ratio', met: true },
      { label: 'Mentor Role', description: 'Mentor at least 2 junior teachers', met: false },
    ],
  },
  {
    level: 4,
    title: 'Expert',
    icon: '⭐⭐⭐⭐',
    teachers: 945,
    avgEngagementScore: 87,
    prerequisites: ['Level 3'],
    requirements: [
      { label: '1+ Years Active', description: '12 months of active platform engagement', met: true },
      { label: '100+ Quality Posts', description: 'Minimum 100 high-quality posts', met: true },
      { label: '98%+ Positive Feedback', description: '98% positive community feedback ratio', met: true },
      { label: 'Leadership Role', description: 'Moderate community or lead initiatives', met: true },
    ],
  },
  {
    level: 5,
    title: 'Master',
    icon: '💎',
    teachers: 320,
    avgEngagementScore: 94,
    prerequisites: ['Level 4'],
    requirements: [
      { label: '5+ Years Engagement', description: '5+ years active platform engagement', met: true },
      { label: '500+ Quality Posts', description: '500+ high-quality verified resources', met: true },
      { label: 'Mentorship Certification', description: 'Complete mentorship certification program', met: true },
      { label: 'Thought Leadership', description: '5+ featured articles or innovations', met: true },
    ],
  },
];

interface DistributionData {
  level: number;
  title: string;
  percentage: number;
  count: number;
}

const LEVEL_DISTRIBUTION: DistributionData[] = [
  { level: 5, title: 'Master', percentage: 3, count: 320 },
  { level: 4, title: 'Expert', percentage: 11, count: 945 },
  { level: 3, title: 'Professional', percentage: 22, count: 1920 },
  { level: 2, title: 'Practitioner', percentage: 33, count: 2850 },
  { level: 1, title: 'Novice', percentage: 31, count: 3420 },
];

export default function AdminTeacherLevelsPage() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const totalTeachers = TEACHER_LEVELS.reduce((sum, level) => sum + level.teachers, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#043658]">Teacher Level Management</h1>
            <p className="mt-1 text-sm text-[#6B7C93]">Track progression, manage requirements, and oversee teacher advancement.</p>
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors">
            <Plus className="h-4 w-4" />
            New Promotion Cycle
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Total Teachers</p>
            <p className="text-3xl font-bold text-[#043658]">{totalTeachers.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Master Teachers</p>
            <p className="text-3xl font-bold text-purple-700">{TEACHER_LEVELS[4].teachers}</p>
            <p className="text-xs text-[#6B7C93] mt-1">Top tier</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Avg Engagement</p>
            <p className="text-3xl font-bold text-[#043658]">{Math.round(TEACHER_LEVELS.reduce((sum, l) => sum + l.avgEngagementScore, 0) / TEACHER_LEVELS.length)}</p>
            <p className="text-xs text-[#6B7C93] mt-1">Platform average</p>
          </div>
          <div className="rounded-lg border border-[#D9E2EC] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6B7C93] mb-1">Pending Promotions</p>
            <p className="text-3xl font-bold text-amber-700">247</p>
            <p className="text-xs text-[#6B7C93] mt-1">Awaiting review</p>
          </div>
        </div>

        {/* Progression Framework & Distribution */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Progression Framework */}
          <div className="lg:col-span-2 rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658] mb-4">Progression Framework</h2>

            {/* Level Progress Bar */}
            <div className="flex gap-2 mb-6">
              {TEACHER_LEVELS.map((level) => (
                <button
                  key={level.level}
                  onClick={() => setSelectedLevel(selectedLevel === level.level ? null : level.level)}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    level.level === 5
                      ? 'bg-purple-500'
                      : level.level === 4
                      ? 'bg-blue-500'
                      : level.level === 3
                      ? 'bg-teal-500'
                      : level.level === 2
                      ? 'bg-green-500'
                      : 'bg-cyan-500'
                  }`}
                  title={level.title}
                />
              ))}
            </div>

            {/* Level Cards */}
            <div className="space-y-3">
              {TEACHER_LEVELS.map((level) => (
                <div
                  key={level.level}
                  onClick={() => setSelectedLevel(selectedLevel === level.level ? null : level.level)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedLevel === level.level
                      ? 'border-[#043658] bg-[#F8FAFC]'
                      : 'border-[#E8EEF3] hover:border-[#D9E2EC]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{level.icon}</span>
                      <div>
                        <p className="font-bold text-[#043658]">LEVEL {level.level} - {level.title.toUpperCase()}</p>
                        <p className="text-xs text-[#6B7C93]">{level.teachers.toLocaleString()} teachers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#043658]">{level.avgEngagementScore}</p>
                      <p className="text-xs text-[#6B7C93]">avg engagement</p>
                    </div>
                  </div>

                  {selectedLevel === level.level && (
                    <div className="mt-4 space-y-2 border-t border-[#E8EEF3] pt-4">
                      {level.requirements.map((req, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          {req.met ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-[#043658]">{req.label}</p>
                            <p className="text-xs text-[#6B7C93]">{req.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Distribution */}
          <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#043658] mb-4">Teacher Distribution</h2>

            <div className="space-y-3">
              {LEVEL_DISTRIBUTION.map((dist) => (
                <div key={dist.level}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-[#043658]">{dist.title}</p>
                    <p className="text-xs font-bold text-[#6B7C93]">{dist.percentage}%</p>
                  </div>
                  <div className="h-2 rounded-full bg-[#E8EEF3] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        dist.level === 5
                          ? 'bg-purple-500'
                          : dist.level === 4
                          ? 'bg-blue-500'
                          : dist.level === 3
                          ? 'bg-teal-500'
                          : dist.level === 2
                          ? 'bg-green-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${dist.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#6B7C93] mt-1">{dist.count.toLocaleString()} teachers</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-[#E8EEF3] space-y-2">
              <button className="w-full flex items-center justify-between rounded-lg border border-[#D9E2EC] px-3 py-2.5 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC] transition-colors">
                View Promotion Queue
                <ChevronRight className="h-4 w-4" />
              </button>
              <button className="w-full flex items-center justify-between rounded-lg border border-[#D9E2EC] px-3 py-2.5 text-sm font-medium text-[#043658] hover:bg-[#F8FAFC] transition-colors">
                Edit Requirements
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Level Requirements Summary */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#043658]">Requirements Summary</h2>
            <button className="text-sm text-[#043658] font-medium hover:text-[#05456F]">Edit All</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E8EEF3]">
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Level</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Min. Engagement</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Requirements</th>
                  <th className="text-left px-4 py-3 font-semibold text-[#6B7C93]">Teachers</th>
                </tr>
              </thead>
              <tbody>
                {TEACHER_LEVELS.map((level) => (
                  <tr key={level.level} className="border-b border-[#E8EEF3] hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3 font-bold text-[#043658]">{level.level}</td>
                    <td className="px-4 py-3 text-[#043658]">{level.title}</td>
                    <td className="px-4 py-3 text-[#043658]">{level.avgEngagementScore}+</td>
                    <td className="px-4 py-3 text-[#043658]">{level.requirements.length} requirements</td>
                    <td className="px-4 py-3 font-medium text-[#043658]">{level.teachers.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
