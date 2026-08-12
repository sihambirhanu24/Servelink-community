"use client";

import { useQuery } from '@tanstack/react-query';
import { FileText, Users, Heart, Bookmark, LucideIcon } from 'lucide-react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  clickable?: boolean;
}

async function getDashboardStats() {
  const { data } = await api.get('/dashboard');
  return data;
}

/** Fetches the real count of communities the teacher has joined (status=APPROVED). */
async function getMyCommunities() {
  const { data } = await api.get('/profile/communities');
  return data as { community: any }[];
}

export function StatsRow() {
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: myCommunities = [] } = useQuery({
    queryKey: ['my-communities-count'],
    queryFn: getMyCommunities,
  });

  const joinedCount = myCommunities.length;

  const stats: Stat[] = [
    {
      icon: FileText,
      value: String(data?.stats?.posts ?? 0),
      label: 'Posts',
    },
    {
      icon: Users,
      value: String(joinedCount),
      label: 'Communities',
      sublabel: joinedCount === 1 ? 'Joined' : 'Joined',
      // onClick: () => router.push('/community/my-communities'),
      // clickable: true,
    },
    {
      icon: Heart,
      value: String(data?.stats?.likes ?? 0),
      label: 'Total Likes',
    },
    {
      icon: Bookmark,
      value: String(data?.stats?.bookmarks ?? 0),
      label: 'Bookmarks',
    },
  ];

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        We could not load your dashboard stats.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Wrapper = stat.clickable ? 'button' : 'div';
        return (
          <Wrapper
            key={stat.label}
            id={stat.clickable ? 'stat-communities-btn' : undefined}
            onClick={stat.onClick}
            className={`rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition-all ${
              stat.clickable
                ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#043658]/30 hover:shadow-md group'
                : ''
            }`}
          >
            <stat.icon
              className={`h-4 w-4 mx-auto transition-colors ${
                stat.clickable
                  ? 'text-slate-400 group-hover:text-[#043658]'
                  : 'text-slate-400'
              }`}
            />
            <p className="mt-2 font-['Lexend'] text-xl font-semibold text-[#043658]">
              {isLoading && stat.label !== 'Communities' ? '…' : stat.value}
            </p>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">
              {stat.sublabel ? `${stat.sublabel}` : stat.label}
            </p>
            {stat.clickable && (
              <p className="mt-1 text-[10px] font-semibold text-[#043658]/60 group-hover:text-[#043658] uppercase tracking-wide transition-colors">
                {stat.label} →
              </p>
            )}
          </Wrapper>
        );
      })}
    </div>
  );
}
