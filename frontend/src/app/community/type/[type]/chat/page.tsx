'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, BookOpen, Atom, FlaskConical, Globe, History,
  Laptop, LineChart, MessageCircle, Search, Shield, Users,
  Dumbbell, Calculator, BookMarked, Languages, Star,
} from 'lucide-react';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/context/AuthContext';

interface PageProps {
  params: Promise<{ type: string }>;
}

// ── Dept config ────────────────────────────────────────
interface DeptConfig {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const DEPARTMENTS: DeptConfig[] = [
  { slug: 'mathematics',   name: 'Mathematics',          shortName: 'Math',    description: 'Lesson plans, activities, assessments and teaching strategies.',   icon: Calculator,   color: 'bg-blue-50 text-blue-600'   },
  { slug: 'english',       name: 'English',               shortName: 'English', description: 'Language teaching, reading, writing resources and assessments.',    icon: BookOpen,     color: 'bg-emerald-50 text-emerald-600' },
  { slug: 'amharic',       name: 'Amharic',               shortName: 'አማ',     description: 'Amharic language, literature, reading and writing education.',       icon: Languages,    color: 'bg-orange-50 text-orange-600'  },
  { slug: 'physics',       name: 'Physics',               shortName: 'Physics', description: 'Physics concepts, experiments, resources and classroom activities.', icon: Atom,         color: 'bg-purple-50 text-purple-600'  },
  { slug: 'chemistry',     name: 'Chemistry',             shortName: 'Chem',    description: 'Chemistry experiments, lab activities and teaching strategies.',     icon: FlaskConical, color: 'bg-pink-50 text-pink-600'    },
  { slug: 'biology',       name: 'Biology',               shortName: 'Bio',     description: 'Biology lessons, experiments, resources and classroom activities.',  icon: BookMarked,   color: 'bg-teal-50 text-teal-600'    },
  { slug: 'geography',     name: 'Geography',             shortName: 'Geo',     description: 'Geography lessons, maps, field activities and resources.',           icon: Globe,        color: 'bg-sky-50 text-sky-600'      },
  { slug: 'history',       name: 'History',               shortName: 'History', description: 'History teaching resources, discussions and classroom activities.',   icon: History,      color: 'bg-amber-50 text-amber-700'  },
  { slug: 'civics',        name: 'Civics',                shortName: 'Civics',  description: 'Civics education, citizenship, discussions and teaching materials.',  icon: Shield,       color: 'bg-indigo-50 text-indigo-600' },
  { slug: 'ict',           name: 'ICT / Computer Science',shortName: 'ICT',     description: 'Technology, programming, digital learning and ICT resources.',        icon: Laptop,       color: 'bg-violet-50 text-violet-600' },
  { slug: 'business',      name: 'Business',              shortName: 'Bus.',    description: 'Business education, entrepreneurship and classroom activities.',      icon: LineChart,    color: 'bg-yellow-50 text-yellow-700'},
  { slug: 'economics',     name: 'Economics',             shortName: 'Econ',    description: 'Economics lessons, teaching strategies, examples and assessments.',   icon: LineChart,    color: 'bg-lime-50 text-lime-700'    },
  { slug: 'pe',            name: 'Physical Education',    shortName: 'P.E.',    description: 'Physical education activities, sports resources and strategies.',     icon: Dumbbell,     color: 'bg-red-50 text-red-600'      },
  { slug: 'general',       name: 'General / Primary',     shortName: 'General', description: 'Connect with teachers across general and primary education.',         icon: Users,        color: 'bg-slate-100 text-slate-600' },
];

// Normalise subject string to a dept slug for matching
function subjectToSlug(subject?: string | null): string | null {
  if (!subject) return null;
  const s = subject.toLowerCase().trim();
  for (const d of DEPARTMENTS) {
    if (s.includes(d.slug) || d.slug.includes(s) || s.includes(d.name.toLowerCase())) {
      return d.slug;
    }
  }
  return null;
}

type FilterKey = 'all' | 'mine' | 'active';

// ── Dept card ──────────────────────────────────────────
function DeptCard({
  dept, isMine, type, teacherCount,
}: {
  dept: DeptConfig;
  isMine: boolean;
  type: string;
  teacherCount: number;
}) {
  const router = useRouter();
  const Icon = dept.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => router.push(`/community/type/${type}/chat/${dept.slug}`)}
      className={`group relative flex cursor-pointer flex-col rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isMine
          ? 'border-[#043658]/30 ring-1 ring-[#043658]/15'
          : 'border-[#E2E8F0] hover:border-[#043658]/25'
      }`}
    >
      {isMine && (
        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#FFC107]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7a5900]">
          <Star className="h-2.5 w-2.5" /> My Dept
        </span>
      )}

      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${dept.color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 pr-12">
          <p className="truncate text-sm font-bold text-[#043658]">{dept.name}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{dept.description}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {teacherCount} teachers
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            Chat
          </span>
        </div>
        <span className="rounded-lg bg-[#043658] px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          Open →
        </span>
      </div>
    </motion.div>
  );
}

// ── Page ───────────────────────────────────────────────
export default function DepartmentSelectPage({ params }: PageProps) {
  const { type } = use(params);
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const teacherSubject = profile?.subject ?? null;
  const mySlug = subjectToSlug(teacherSubject);

  const communityLabel: Record<string, string> = {
    school: 'School', woreda: 'Woreda', zone: 'Zone',
    region: 'Regional', national: 'National',
  };

  // Simple deterministic teacher count per dept (real data would come from API)
  function teacherCount(slug: string): number {
    const seed = slug.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return 12 + (seed % 40);
  }

  const filtered = useMemo(() => {
    let list = DEPARTMENTS;
    if (filter === 'mine' && mySlug) {
      list = list.filter(d => d.slug === mySlug);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.slug.includes(q),
      );
    }
    return list;
  }, [search, filter, mySlug]);

  const myDept = mySlug ? DEPARTMENTS.find(d => d.slug === mySlug) : null;

  return (
    <div className="h-screen overflow-hidden bg-[#F7FAFC]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">

          {/* Back + header */}
          <div className="mb-5">
            <Link
              href={`/community/type/${type}`}
              className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 transition-colors hover:text-[#043658]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {communityLabel[type] ?? type} Community
            </Link>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">
                  {communityLabel[type] ?? type} Community
                </p>
                <h1 className="mt-1 text-xl font-bold text-[#043658]">
                  Department Communities
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Connect with teachers in your department and collaborate on teaching, resources, and ideas.
                </p>
              </div>

              {myDept && (
                <Link
                  href={`/community/type/${type}/chat/${myDept.slug}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#032d4a] hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Open My Department
                </Link>
              )}
            </div>
          </div>

          {/* School communities shortcut (Woreda level only) */}
          {type === 'woreda' && (
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                School Communities
              </p>
              <Link
                href="/community/type/woreda/schools"
                className="group flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#043658]/30 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#043658]">
                    <Users className="h-5 w-5 text-[#FFC107]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#043658]">Schools in My Woreda</p>
                    <p className="text-xs text-slate-500">Browse and join school communities in your Woreda</p>
                  </div>
                </div>
                <span className="rounded-lg bg-[#043658] px-3 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Browse Schools →
                </span>
              </Link>
            </div>
          )}

          {/* Department communities header */}
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Department Communities
          </p>

          {/* Search + filter */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search departments..."
                className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#043658] placeholder:text-slate-400 focus:border-[#043658]/40 focus:outline-none focus:ring-2 focus:ring-[#043658]/10"
              />
            </div>
            {(['all', 'mine', 'active'] as FilterKey[]).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                disabled={f === 'mine' && !mySlug}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  filter === f
                    ? 'bg-[#043658] text-white font-semibold'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'All Departments' : f === 'mine' ? 'My Department' : 'Most Active'}
              </button>
            ))}
          </div>

          {/* My department highlight */}
          {myDept && filter !== 'mine' && !search && (
            <div className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Your Department
              </p>
              <DeptCard
                dept={myDept}
                isMine
                type={type}
                teacherCount={teacherCount(myDept.slug)}
              />
            </div>
          )}

          {/* All departments grid */}
          {!(filter === 'mine' && mySlug && !search) && (
            <>
              {myDept && filter !== 'mine' && !search && (
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Other Departments
                </p>
              )}

              {filtered.length === 0 ? (
                <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center">
                  <MessageCircle className="h-8 w-8 text-slate-300" />
                  <p className="mt-3 font-semibold text-[#043658]">
                    {search ? 'No departments match your search.' : 'No departments available yet.'}
                  </p>
                  <p className="mt-1 max-w-xs text-sm text-slate-400">
                    {search
                      ? 'Try a different keyword.'
                      : 'Your Woreda administrator will make department communities available when they are ready.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered
                    .filter(d => !myDept || d.slug !== myDept.slug || filter === 'mine' || !!search)
                    .map(dept => (
                      <DeptCard
                        key={dept.slug}
                        dept={dept}
                        isMine={dept.slug === mySlug}
                        type={type}
                        teacherCount={teacherCount(dept.slug)}
                      />
                    ))}
                </div>
              )}
            </>
          )}

          {/* Mine-only filtered view */}
          {filter === 'mine' && mySlug && !search && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map(dept => (
                <DeptCard
                  key={dept.slug}
                  dept={dept}
                  isMine
                  type={type}
                  teacherCount={teacherCount(dept.slug)}
                />
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
