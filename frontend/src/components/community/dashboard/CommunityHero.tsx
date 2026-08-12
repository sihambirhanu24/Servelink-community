"use client";

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import api from '@/lib/axios';

interface CommunityHeroProps {
  community?: {
    name?: string;
    description?: string;
    memberCount?: number;
  } | null;
}

async function getDashboardSummary() {
  const [{ data: user }, { data: stats }] = await Promise.all([
    api.get('/auth/me'),
    api.get("/dashboard")
  ]);

  return { user, stats };
}

export default function CommunityHero({ community }: CommunityHeroProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['community-hero'],
    queryFn: getDashboardSummary,
  });

  const communityName = community?.name?.trim() || 'ServeLink Community';
  const description = community?.description?.trim() ||
    'Connect with educators, share teaching resources, ask questions, collaborate across communities, and grow your professional network.';
  const memberCount = community?.memberCount ?? 0;
  const stats = [
    { value: memberCount >= 1000 ? `${(memberCount / 1000).toFixed(1)}k` : memberCount.toString(), label: 'Total Members' },
    { value: data?.stats?.posts?.toString() ?? '0', label: 'Posts Shared' },
    { value: data?.stats?.communities?.toString() ?? '0', label: 'Communities Joined' },
    { value: data?.stats?.bookmarks?.toString() ?? '0', label: 'Bookmarks' },
  ];

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#043658_0%,#0A4A74_100%)] p-6 shadow-[0_20px_45px_-24px_rgba(4,54,88,0.75)] sm:p-10">
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
      <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full border border-[#FFC107]/10" />

      <div className="relative">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFC107]">Academic Collaboration Platform</p>
            <h1 className="mt-4 font-['Lexend'] text-4xl font-semibold tracking-tight text-white sm:text-6xl">{communityName}</h1>
            <p className="mt-2 text-sm font-medium text-[#FFC107]">{isLoading ? 'Loading your profile…' : isError ? 'Unable to load profile info.' : `${data?.user?.firstName ?? ''} ${data?.user?.lastName ?? ''}`.trim() || 'Teacher'}</p>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">{description}</p>
          </div>

          {/* <button type="button" onClick={() => setComposerOpen(o => !o)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#032d4a] hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]">
              {composerOpen ? <><X className="h-4 w-4"/> Cancel</> : <><Plus className="h-4 w-4"/> Create Post</>}
            </button> */}
        </div>
      </div>

    </section>
  );
}