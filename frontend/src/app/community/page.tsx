"use client";

import { useState } from 'react';
import Link from 'next/link';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { StatsRow } from '@/components/dashboard/StatsRow';
import { LatestActivityCard } from '@/components/dashboard/LatestActivityCard';
import { CommunitySideRail } from '@/components/community/CommunitySideRail';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Avatar } from '@/components/common/Avatar';
import { PenSquare, MapPin, GraduationCap } from 'lucide-react';

function CommunityPageHeader() {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const firstName = profile?.firstName ?? user?.firstName ?? '';
  const lastName = profile?.lastName ?? user?.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || 'Teacher';
  const level = (profile?.level ?? user?.level ?? '').replace(/_/g, ' ');
  const school = profile?.school ?? '';
  const woreda = profile?.woreda ?? '';
  const profileImage = profile?.profileImage ?? user?.profileImage ?? undefined;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">
          ServeLink Community
        </p>
        <h1 className="mt-0.5 font-['Lexend'] text-xl font-semibold text-[#043658]">
          Connect, collaborate and share with educators.
        </h1>

        {(firstName || school) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Avatar
              name={name}
              profileImage={profileImage}
              size="sm"
              showRing={false}
            />
            <span className="text-sm font-semibold text-[#043658]">{name}</span>
            {level && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 rounded-full bg-[#043658]/8 px-2.5 py-0.5 text-xs font-semibold text-[#043658]">
                  <GraduationCap className="h-3 w-3" />
                  {level}
                </span>
              </>
            )}
            {school && (
              <>
                <span className="text-slate-300">·</span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {school}
                  {woreda ? `, ${woreda}` : ''}
                </span>
              </>
            )}
          </div>
        )}
      </div>

     
    </div>
  );
}

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">

          {/* Page header — identity row + Create Post CTA */}
          <div className="mb-4 sm:mb-5 rounded-xl border border-slate-200 bg-white px-4 sm:px-5 py-3 sm:py-4 shadow-sm">
            <CommunityPageHeader />
          </div>

          {/* Stats */}
          <div className="mb-4 sm:mb-5">
            <StatsRow />
          </div>

          {/* Two-column grid: feed (left) + sticky rail (right) */}
          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_272px]">

            {/* ── Left: feed ── */}
            <div className="min-w-0">
              <LatestActivityCard />
            </div>

            {/* ── Right: sticky utility rail ── */}
            <aside className="hidden lg:block">
              <div className="sticky top-0 h-fit">
                <CommunitySideRail />
              </div>
            </aside>

          </div>

          <div className="mt-4 sm:mt-5 lg:hidden">
            <CommunitySideRail />
          </div>

        </div>
      </main>
    </div>
  );
}
