'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { GraduationCap, Lock, LogIn, UserPlus } from 'lucide-react';

const PAGE_META: Record<string, { label: string; title: string; description: string }> = {
  dashboard: {
    label: 'Teacher Dashboard',
    title: 'Your Teacher Dashboard',
    description: 'Manage your communities, posts, levels, and activity — all in one place.',
  },
  profile: {
    label: 'My Profile',
    title: 'Your Teacher Profile',
    description: 'View and manage your profile details, level progress, and community access.',
  },
};

function AccessPageContent() {
  const params = useSearchParams();
  const page = params.get('page') ?? 'dashboard';
  const meta = PAGE_META[page] ?? PAGE_META['dashboard'];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7FAFC]">

      {/* ── Navbar ── */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link href="/landing" className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="ServeLink Logo" 
              className="h-10 w-10 object-contain"
            />
            <span className="text-lg font-extrabold tracking-tight text-[#043658]">
              ServeLink
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-[#043658] transition-colors hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-[#FFC107] px-5 py-2.5 text-sm font-bold text-[#043658] shadow-sm transition-all hover:bg-[#e6ad00]"
            >
              Join ServeLink
            </Link>
          </div>
        </div>
      </header>

      {/* ── Gate card ── */}
      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-lg">

          {/* Subtle background glow */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 translate-y-4 scale-95 rounded-3xl bg-[#043658]/5 blur-2xl" />

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

              {/* Top icon area with gradient */}
              <div className="relative flex flex-col items-center bg-gradient-to-b from-[#043658]/5 via-[#043658]/3 to-white px-8 py-10">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#043658] to-[#032d4a] shadow-xl ring-4 ring-white">
                  <Lock className="h-9 w-9 text-[#FFC107]" />
                </div>
                <h2 className="mt-5 text-2xl font-extrabold text-[#043658]">
                  You're not signed in
                </h2>
                <p className="mt-3 max-w-sm text-center text-sm leading-relaxed text-slate-600">
                  Sign in to your ServeLink teacher account to access{' '}
                  <span className="font-bold text-[#043658]">
                    {meta.label.toLowerCase()}
                  </span>{' '}
                  and your professional community.
                </p>
              </div>

              {/* Buttons section */}
              <div className="px-8 pb-8 pt-6">
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/login"
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#043658] px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#032d4a] hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]"
                  >
                    <LogIn className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="group flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-slate-200 bg-white px-6 py-4 text-sm font-bold text-[#043658] shadow-sm transition-all hover:border-[#043658] hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
                  >
                    <UserPlus className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Create a Teacher Account
                  </Link>
                </div>

                {/* Benefits badges */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC107]/15 px-3 py-1.5 text-xs font-semibold text-[#043658]">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Free to join
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043658]/10 px-3 py-1.5 text-xs font-semibold text-[#043658]">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Start at Level 1
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFC107]/15 px-3 py-1.5 text-xs font-semibold text-[#043658]">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    No approval required
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Back link */}
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link href="/landing" className="inline-flex items-center gap-1.5 font-semibold text-[#043658] transition-colors hover:text-[#032d4a] hover:underline">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to ServeLink
            </Link>
          </p>

        </div>
      </main>
    </div>
  );
}

export default function AccessPage() {
  return (
    <Suspense>
      <AccessPageContent />
    </Suspense>
  );
}
