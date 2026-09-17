'use client';

import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

export function DashboardSuggestedCommunities() {
  const { user } = useAuth();

  // Fetch user's communities for progress
  const { data: communitiesData } = useQuery({
    queryKey: ['user-communities'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/community/accessible`, {
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
    </div>
  );
}
