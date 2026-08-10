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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#043658]">
              <GraduationCap className="h-5 w-5 text-[#FFC107]" />
            </div>
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

      {/* ── Page breadcrumb ── */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-10">
          <span className="mb-1.5 inline-block rounded-full bg-[#FFC107]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#043658]">
            {meta.label}
          </span>
          <h1 className="text-2xl font-extrabold text-[#043658] sm:text-3xl">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{meta.description}</p>
        </div>
      </div>

      {/* ── Gate card ── */}
      <main className="flex flex-1 items-start justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-md">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

            {/* Top icon area */}
            <div className="flex flex-col items-center bg-[#043658]/[0.03] px-8 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#043658] shadow-lg">
                <Lock className="h-7 w-7 text-[#FFC107]" />
              </div>
              <h2 className="mt-4 text-xl font-extrabold text-[#043658]">
                You're not signed in
              </h2>
              <p className="mt-2 max-w-xs text-center text-sm leading-relaxed text-slate-500">
                Sign in to your ServeLink teacher account to access{' '}
                <span className="font-semibold text-[#043658]">
                  {meta.label.toLowerCase()}
                </span>{' '}
                and your professional community.
              </p>
            </div>

            {/* Buttons */}
            <div className="px-8 pb-8 pt-5">
              <div className="flex flex-col gap-3">
                <Link
                  href="/auth/login"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#043658] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#032d4a] hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[#043658]/20 bg-white px-6 py-3.5 text-sm font-bold text-[#043658] transition-all hover:border-[#043658] hover:bg-slate-50 active:scale-[0.98]"
                >
                  <UserPlus className="h-4 w-4" />
                  Create a Teacher Account
                </Link>
              </div>

              <p className="mt-5 text-center text-xs text-slate-400">
                Free to join · Start at Level 1 · No approval required
              </p>
            </div>
          </div>

          {/* Back link */}
          <p className="mt-5 text-center text-sm text-slate-500">
            <Link href="/landing" className="font-semibold text-[#043658] hover:underline">
              ← Back to ServeLink
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
