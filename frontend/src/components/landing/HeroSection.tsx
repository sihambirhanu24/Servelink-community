'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  GraduationCap, ArrowRight, CheckCircle2, Lock,
  Heart, MessageCircle, Bookmark, Share2,
  LayoutDashboard, Users, FileText, BookmarkIcon,
  BarChart2, Settings, FileDown, BadgeCheck,
  Bell, Search,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   Mini sidebar icon button
───────────────────────────────────────────── */
function SideIcon({ icon: Icon, active = false }: { icon: React.ElementType; active?: boolean }) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
        active ? 'bg-[#FFC107]/20 text-[#FFC107]' : 'text-slate-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      <Icon className="h-4 w-4" />
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feed post card inside the mock
───────────────────────────────────────────── */
function FeedPost({
  initials, name, level, community, time, title, desc,
  likes, comments, saves, hasPdf = false, hasImg = false, colorClass = 'bg-[#043658]',
}: {
  initials: string; name: string; level: string; community: string; time: string;
  title: string; desc?: string; likes: number; comments: number; saves: number;
  hasPdf?: boolean; hasImg?: boolean; colorClass?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colorClass} text-[9px] font-bold text-white`}>
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-[#043658]">{name}</span>
              <BadgeCheck className="h-3 w-3 text-[#FFC107]" />
            </div>
            <span className="text-[9px] text-slate-400">{level} · {community} · {time}</span>
          </div>
        </div>
      </div>

      <p className="mt-1.5 text-[11px] font-semibold leading-snug text-[#043658]">{title}</p>

      {desc && <p className="mt-1 text-[10px] leading-relaxed text-slate-500 line-clamp-2">{desc}</p>}

      {hasPdf && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-100">
            <FileDown className="h-3 w-3 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-[#043658]">Grade 8 Math Activities.pdf</p>
            <p className="text-[9px] text-slate-400">1.4 MB · PDF</p>
          </div>
        </div>
      )}

      {hasImg && (
        <div className="mt-2 h-14 w-full rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
          <span className="text-[9px] font-medium text-slate-500">Classroom Photo</span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <button className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 transition-colors">
          <Heart className="h-3 w-3" />{likes}
        </button>
        <button className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#043658] transition-colors">
          <MessageCircle className="h-3 w-3" />{comments}
        </button>
        <button className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#FFC107] transition-colors">
          <Bookmark className="h-3 w-3" />{saves}
        </button>
        <button className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 hover:text-[#043658] transition-colors">
          <Share2 className="h-3 w-3" />Share
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Full SaaS app-window mock
───────────────────────────────────────────── */
function AppWindowMock() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      {/* Window chrome */}
      <div className="flex h-8 items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <div className="mx-auto flex h-4.5 w-36 items-center justify-center rounded-md bg-slate-200 px-2">
          <span className="text-[9px] text-slate-500">servelink.app/dashboard</span>
        </div>
      </div>

      {/* App shell */}
      <div className="flex h-[480px]">
        {/* ── Navy sidebar ── */}
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[#032d4a] bg-[#043658] py-3">
          <div className="mb-3 flex h-7 w-7 items-center justify-center rounded-lg bg-[#FFC107]">
            <GraduationCap className="h-4 w-4 text-[#043658]" />
          </div>
          <SideIcon icon={LayoutDashboard} active />
          <SideIcon icon={Users} />
          <SideIcon icon={FileText} />
          <SideIcon icon={BookmarkIcon} />
          <SideIcon icon={BarChart2} />
          <div className="mt-auto">
            <SideIcon icon={Settings} />
          </div>
        </div>

        {/* ── Left panel: profile + communities ── */}
        <div className="w-[200px] shrink-0 overflow-y-auto border-r border-slate-100 bg-[#F7FAFC] p-3">
          {/* Profile card */}
          <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#043658] text-sm font-bold text-white ring-2 ring-[#FFC107]/40">
                SB
              </div>
              <p className="mt-1.5 text-[11px] font-bold text-[#043658]">Siham Birhanu</p>
              <span className="mt-0.5 rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[9px] font-bold uppercase text-[#043658]">
                Level 1 Teacher
              </span>
              <p className="mt-0.5 text-[9px] text-slate-400">Mathematics Teacher</p>
            </div>

            {/* Stats */}
            <div className="mt-2.5 grid grid-cols-2 gap-1.5">
              {[['28','Posts'],['157','Likes'],['3','Communities'],['18','Saved']].map(([v,l]) => (
                <div key={l} className="rounded-lg bg-slate-50 py-1.5 text-center">
                  <p className="text-sm font-extrabold text-[#043658]">{v}</p>
                  <p className="text-[8px] text-slate-400">{l}</p>
                </div>
              ))}
            </div>

            {/* Level progress */}
            <div className="mt-2.5">
              <div className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
                <span className="font-semibold text-[#043658]">Level 1</span>
                <span>Level 2</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-[#FFC107]"
                  initial={{ width: 0 }}
                  animate={{ width: '22%' }}
                  transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-1 text-[9px] text-slate-400">22% to next level</p>
            </div>
          </div>

          {/* School community status */}
          <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-800">School Community</span>
              <span className="ml-auto rounded-full bg-emerald-200 px-1.5 py-0.5 text-[8px] font-bold text-emerald-800">ACTIVE</span>
            </div>
          </div>

          {/* Available communities */}
          <p className="mt-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Available</p>
          {[
            { name: 'Woreda Mathematics', count: '243 Teachers' },
            { name: 'Science Teachers', count: '189 Teachers' },
          ].map(({ name, count }) => (
            <div key={name} className="mt-1.5 rounded-xl border border-slate-200 bg-white p-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-[#043658]">{name}</p>
                  <p className="text-[8px] text-slate-400">{count}</p>
                </div>
                <button className="rounded-lg bg-[#043658] px-2 py-0.5 text-[8px] font-bold text-white">Join</button>
              </div>
            </div>
          ))}

          {/* Locked communities */}
          <p className="mt-2.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">Locked</p>
          {['Zone Community','Regional','National'].map((name) => (
            <div key={name} className="mt-1 flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
              <Lock className="h-3 w-3 text-slate-300" />
              <span className="text-[10px] text-slate-400">{name}</span>
            </div>
          ))}
        </div>

        {/* ── Right panel: community feed ── */}
        <div className="flex-1 overflow-y-auto p-3">
          {/* Feed topbar */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-bold text-[#043658]">Community Feed</p>
            <div className="flex items-center gap-1.5">
              <div className="flex h-6 w-24 items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2">
                <Search className="h-3 w-3 text-slate-400" />
                <span className="text-[9px] text-slate-400">Search…</span>
              </div>
              <Bell className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2.5">
            <FeedPost
              initials="SB" name="Siham Birhanu" level="Level 1"
              community="School Community" time="2h ago"
              title="Interactive Mathematics Activities for Grade 8"
              desc="Here are some activities I used to make algebra more engaging for my students this week…"
              likes={24} comments={8} saves={12}
              hasPdf colorClass="bg-[#043658]"
            />
            <FeedPost
              initials="YT" name="Yared Tekle" level="Level 2"
              community="Woreda Network" time="5h ago"
              title="Implementing STEM Education in Grade 8"
              likes={16} comments={4} saves={9}
              hasImg colorClass="bg-slate-600"
            />
            <FeedPost
              initials="MA" name="Martha Alem" level="Level 2"
              community="Woreda Community" time="8h ago"
              title="How do you make Grade 10 biology sessions more interactive?"
              likes={42} comments={15} saves={8}
              colorClass="bg-[#043658]/70"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Feature strip
───────────────────────────────────────────── */
const STRIP = [
  { icon: Users, label: 'Connect', desc: 'Build relationships with teachers.', gold: false },
  { icon: FileText, label: 'Share', desc: 'Lesson plans, PDFs, images, DOCX.', gold: true },
  { icon: MessageCircle, label: 'Discuss', desc: 'Exchange classroom experiences.', gold: false },
  { icon: BookmarkIcon, label: 'Save', desc: 'Bookmark useful posts.', gold: false },
  { icon: BarChart2, label: 'Grow', desc: 'Progress through five levels.', gold: true },
];

/* ─────────────────────────────────────────────
   Benefits row (below CTA)
───────────────────────────────────────────── */
const BENEFITS = [
  { emoji: '🎓', title: 'Start at Level 1', sub: 'Automatically after registration' },
  { emoji: '👥', title: '5 Community Levels', sub: 'Grow step by step' },
  { emoji: '🛡', title: 'Built for Teachers', sub: 'Professional educator network' },
];

/* ─────────────────────────────────────────────
   Main export
───────────────────────────────────────────── */
export function HeroSection() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-b from-[#F7FAFC] via-white to-white pb-10 pt-24"
      >
        {/* Subtle background accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-[#043658]/[0.03] blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14 xl:gap-16">

            {/* ── Left: copy ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col justify-center"
            >
              {/* Pill badge */}
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#FFC107]/30 bg-[#FFC107]/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-[#043658]">
                <GraduationCap className="h-3.5 w-3.5 text-[#FFC107]" />
                The Professional Community for Educators
              </span>

              {/* Headline */}
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-[#043658] sm:text-5xl xl:text-[3.5rem]">
                Teachers Learn Better<br />
                When They{' '}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10 text-[#FFC107]">Learn Together.</span>
                  <svg
                    aria-hidden
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 8"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path d="M1 6 Q75 1 150 5 Q225 9 299 4" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.5" />
                  </svg>
                </span>
              </h1>

              {/* Body */}
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-slate-600">
                ServeLink is a professional community built for teachers to connect with educators,
                share teaching knowledge, participate in meaningful discussions, exchange resources,
                and grow through a structured five-level community system.
              </p>

              {/* CTAs */}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#043658] px-6 py-3.5 text-sm font-bold text-white shadow-lg ring-1 ring-[#043658]/10 transition-all hover:bg-[#032d4a] hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Create Your Teacher Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/community"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#043658]/20 bg-white px-6 py-3.5 text-sm font-bold text-[#043658] transition-all hover:border-[#043658] hover:bg-slate-50 active:scale-[0.98]"
                >
                  Explore the Platform
                </Link>
              </div>

              {/* 3 benefits - REMOVED */}
              {/* 
              <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {BENEFITS.map(({ emoji, title, sub }) => (
                  <div
                    key={title}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 shadow-sm"
                  >
                    <span className="text-xl leading-none">{emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-[#043658]">{title}</p>
                      <p className="text-[11px] text-slate-500">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
              */}
            </motion.div>

            {/* ── Right: app window ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.15 }}
              className="relative"
            >
              {/* Glow behind window */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 translate-y-4 scale-[0.97] rounded-2xl bg-[#043658]/8 blur-2xl"
              />
              <AppWindowMock />
            </motion.div>

          </div>
        </div>
      </section>

    </>
  );
}
