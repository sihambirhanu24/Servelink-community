'use client';

import { ThumbsUp, MessageCircle, Bell, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface Alert {
  id: string;
  type: 'like' | 'comment';
  user: string;
  message: string;
  time: string;
  read: boolean;
}

export function DashboardSuggestedCommunities() {
  const { user } = useAuth();

  // Fetch user's communities for progress
  const { data: communitiesData } = useQuery({
    queryKey: ['user-communities'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/community/accessible', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
    enabled: !!user,
  });

  const communities = Array.isArray(communitiesData) ? communitiesData : [];
  const totalCommunities = 6;
  const joinedCount = communities.length;
  const progress = (joinedCount / totalCommunities) * 100;

  // Get next community to unlock
  const getNextCommunity = () => {
    const types = ['SCHOOL', 'WOREDA', 'ZONE', 'REGION', 'NATIONAL'];
    const joined = new Set(communities.map((c: any) => c.type));
    const next = types.find((t) => !joined.has(t));
    if (!next) return 'All Unlocked';
    return next.charAt(0) + next.slice(1).toLowerCase() + ' Community';
  };

  // Fetch engagement stats
  const { data: statsData } = useQuery({
    queryKey: ['user-engagement-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/posts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const posts = await response.json();
      
      const likes = posts.reduce((sum: number, post: any) => 
        sum + (post.likesCount || post.communityLikes?.length || 0), 0
      );
      const comments = posts.reduce((sum: number, post: any) => 
        sum + (post.comments?.length || 0), 0
      );
      
      return { likes, comments };
    },
    enabled: !!user,
  });

  // Mock alerts - replace with real API call
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'like',
      user: 'Sarah',
      message: 'liked your post',
      time: '10m ago',
      read: false,
    },
    {
      id: '2',
      type: 'comment',
      user: 'Michael',
      message: 'commented',
      time: '1h ago',
      read: false,
    },
  ];

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Communities Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-[#043658]">Communities</h3>
          <span className="rounded-full bg-slate-100 px-2.5 sm:px-3 py-1 text-xs font-bold text-[#043658] whitespace-nowrap">
            {joinedCount} / {totalCommunities} Joined
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-[#043658] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mb-4 text-sm text-slate-600">
          Next unlock: <span className="font-bold text-[#043658]">{getNextCommunity()}</span>
        </p>

        <Link
          href="/community/chat"
          className="block w-full rounded-lg border-2 border-[#043658] py-2.5 text-center text-sm font-bold text-[#043658] transition-all hover:bg-[#043658] hover:text-white"
        >
          View Communities
        </Link>
      </div>

      {/* Engagement Stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <h3 className="mb-4 text-lg sm:text-xl font-bold text-[#043658]">Engagement</h3>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Likes Received */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-5 text-center">
            {statsData ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-[#043658]">{statsData.likes}</p>
                <p className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-600">LIKES RCVD</p>
              </>
            ) : (
              <Loader2 className="mx-auto h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#043658]" />
            )}
          </div>

          {/* Comments */}
          <div className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-5 text-center">
            {statsData ? (
              <>
                <p className="text-2xl sm:text-3xl font-bold text-[#043658]">{statsData.comments}</p>
                <p className="mt-1 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-slate-600">COMMENTS</p>
              </>
            ) : (
              <Loader2 className="mx-auto h-6 w-6 sm:h-8 sm:w-8 animate-spin text-[#043658]" />
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 sm:px-5 py-3 sm:py-4">
          <h3 className="text-lg sm:text-xl font-bold text-[#043658]">Alerts</h3>
          {unreadCount > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-2.5 sm:gap-3 border-l-4 border-l-[#FFC107] bg-blue-50/50 px-3 sm:px-5 py-3 sm:py-4 transition-colors hover:bg-blue-50"
              >
                <div className="flex-shrink-0">
                  {alert.type === 'like' ? (
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#043658]">
                      <ThumbsUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-[#043658]">
                      <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-[#043658]">
                    <span className="font-bold">{alert.user}</span> {alert.message}
                  </p>
                  <p className="mt-0.5 text-[10px] sm:text-xs text-slate-500">{alert.time}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 sm:px-5 py-8 sm:py-12 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 sm:h-12 sm:w-12 text-slate-300" />
              <p className="text-xs sm:text-sm text-slate-500">No new alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
