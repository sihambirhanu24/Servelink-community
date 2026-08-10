'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, GraduationCap, MapPin,
  MessageCircle, RefreshCw, Search, Star, Users,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useProfile } from '@/hooks/useProfile';
import { useWoredaSchools } from '@/hooks/useWoredaSchools';
import type { WoredaSchool } from '@/services/community';

// ── Skeleton ───────────────────────────────────────────
function SchoolCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-slate-200" />
          <div className="h-3 w-1/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="h-3 w-20 rounded bg-slate-100" />
        <div className="h-3 w-20 rounded bg-slate-100" />
      </div>
      <div className="mt-3 h-8 w-full rounded-lg bg-slate-100" />
    </div>
  );
}

// ── School card ────────────────────────────────────────
function SchoolCard({ school, isMySchool }: { school: WoredaSchool; isMySchool: boolean }) {
  const router = useRouter();
  const memberCount = school._count.communityMembers;
  const postCount   = school._count.posts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`group relative flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isMySchool
          ? 'border-[#043658]/30 ring-1 ring-[#043658]/15'
          : 'border-[#E2E8F0] hover:border-[#043658]/25'
      }`}
    >
      {isMySchool && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7a5900]">
          <Star className="h-2.5 w-2.5" /> My School
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#043658]">
          <GraduationCap className="h-5 w-5 text-[#FFC107]" />
        </div>
        <div className="min-w-0 flex-1 pr-16">
          <p className="truncate text-sm font-bold text-[#043658]">{school.name}</p>
          {school.woreda && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              {school.woreda}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {memberCount} {memberCount === 1 ? 'teacher' : 'teachers'}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {postCount} {postCount === 1 ? 'post' : 'posts'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => router.push(`/community/type/woreda/schools/${school.id}`)}
        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#043658] py-2 text-xs font-semibold text-white transition-all hover:bg-[#032d4a] group-hover:shadow-sm active:scale-[0.98]"
      >
        Open Community →
      </button>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function WoredaSchoolsPage() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data, isLoading, isError, refetch } = useWoredaSchools();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const mySchool = profile?.school?.trim().toLowerCase() ?? '';

  const filtered = useMemo(() => {
    if (!data?.schools) return [];
    let list = data.schools;
    if (filter === 'mine') {
      list = list.filter(s => s.name.toLowerCase().includes(mySchool));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [data, search, filter, mySchool]);

  const mySchoolItem = data?.schools.find(s =>
    s.name.toLowerCase().includes(mySchool) && mySchool.length > 0,
  ) ?? null;

  const woredaName = data?.woreda || profile?.woreda || '—';

  return (
    <div className="h-screen overflow-hidden bg-[#F7FAFC]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Back + header */}
          <div className="mb-5">
            <Link
              href="/community/type/woreda"
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-[#043658]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Woreda Community
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">
                  Woreda Community
                </p>
                <h1 className="mt-1 text-xl font-bold text-[#043658]">
                  School Communities
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Connect with teachers and collaborate within your schools.
                </p>

                {!isLoading && woredaName !== '—' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-xs font-medium text-[#043658] shadow-sm">
                    <MapPin className="h-3 w-3 text-[#FFC107]" />
                    {woredaName} Woreda
                  </div>
                )}
              </div>

              {mySchoolItem && (
                <button
                  type="button"
                  onClick={() => router.push(`/community/type/woreda/schools/${mySchoolItem.id}`)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#032d4a] hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open My School
                </button>
              )}
            </div>
          </div>

          {/* Search + filter */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search schools..."
                className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#043658] placeholder:text-slate-400 focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/10"
              />
            </div>
            {(['all', 'mine'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                disabled={f === 'mine' && !mySchool}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  filter === f
                    ? 'bg-[#043658] text-white font-semibold'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'All Schools' : 'My School'}
              </button>
            ))}
          </div>

          {/* Error */}
          {isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
              <p className="mt-2 font-semibold text-red-700">Couldn't load school communities.</p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" /> Try Again
              </button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => <SchoolCardSkeleton key={i} />)}
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && (
            <>
              {/* My school highlight */}
              {mySchoolItem && filter !== 'mine' && !search && (
                <div className="mb-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Your School
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    <SchoolCard school={mySchoolItem} isMySchool />
                  </div>
                </div>
              )}

              {/* Schools section label */}
              {mySchoolItem && filter !== 'mine' && !search && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {`Schools in ${woredaName} Woreda`}
                </p>
              )}

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                  <GraduationCap className="h-10 w-10 text-slate-300" />
                  <p className="mt-3 font-semibold text-[#043658]">
                    {search
                      ? 'No schools match your search.'
                      : 'No school communities available yet.'}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-slate-400">
                    {search
                      ? 'Try a different keyword.'
                      : 'There are currently no school communities available in your Woreda.'}
                  </p>
                  {!search && (
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#043658] hover:bg-slate-50 transition-colors"
                    >
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered
                    .filter(s => !mySchoolItem || filter === 'mine' || !!search || s.id !== mySchoolItem.id)
                    .map(school => (
                      <SchoolCard
                        key={school.id}
                        school={school}
                        isMySchool={school.id === mySchoolItem?.id}
                      />
                    ))}
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  );
}
