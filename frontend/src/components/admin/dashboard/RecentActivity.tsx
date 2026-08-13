'use client';

import { useEffect, useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
  id: string;
  type: 'registration' | 'verification' | 'report' | 'level_upgrade';
  title: string;
  description: string;
  timestamp: string;
  icon?: React.ReactNode;
}

interface RecentActivityProps {
  activities: ActivityItem[];
  isLoading?: boolean;
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  if (isLoading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-6 w-40 bg-slate-200 rounded mb-4"></div>
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-10 w-10 bg-slate-200 rounded-full flex-shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-200 rounded"></div>
                <div className="h-3 w-32 bg-slate-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-[#043658] mb-4">
          Recent Activity
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
            <AlertCircle className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm">
            No recent activity yet
          </p>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return <UserPlus className="h-5 w-5 text-blue-600" />;
      case 'verification':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'report':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'level_upgrade':
        return <TrendingUp className="h-5 w-5 text-amber-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-400" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-50';
      case 'verification':
        return 'bg-green-50';
      case 'report':
        return 'bg-red-50';
      case 'level_upgrade':
        return 'bg-amber-50';
      default:
        return 'bg-slate-50';
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-[#043658] mb-4">
        Recent Activity
      </h3>

      <div className="space-y-3">
        {activities.slice(0, 6).map((activity) => (
          <div
            key={activity.id}
            className={`flex gap-3 p-3 rounded-lg ${getActivityBgColor(activity.type)}`}
          >
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-white flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {activity.title}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {activity.description}
              </p>
            </div>
            <div className="flex-shrink-0 text-xs text-slate-500">
              {mounted ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : '—'}
            </div>
          </div>
        ))}
      </div>

      <button className="mt-4 w-full py-2 text-center text-sm font-medium text-[#043658] hover:bg-slate-50 rounded-lg transition-colors">
        View All Activity
      </button>
    </div>
  );
}
