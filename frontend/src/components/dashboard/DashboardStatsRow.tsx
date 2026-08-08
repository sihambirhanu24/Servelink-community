'use client';

import { FileText, Users, Heart, Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { DashboardStats } from '@/types/dashboard';

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface Props {
  stats: DashboardStats;
}

export function DashboardStatsRow({ stats }: Props) {
  const router = useRouter();

  const items = [
    {
      icon: FileText,
      value: fmt(stats.posts),
      label: 'Posts',
      href: '/profile/posts',
    },
    {
      icon: Users,
      value: fmt(stats.communities),
      label: 'Communities',
      href: '/community/my-communities',
    },
    {
      icon: Heart,
      value: fmt(stats.likes),
      label: 'Likes',
      href: undefined,
    },
    {
      icon: Bookmark,
      value: fmt(stats.bookmarks),
      label: 'Saved',
      href: '/bookmarks',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {items.map(({ icon: Icon, value, label, href }) => (
        <button
          key={label}
          type="button"
          onClick={() => href && router.push(href)}
          className={`group flex flex-col items-center gap-1 rounded-xl border border-slate-200 bg-white py-3.5 px-2 transition-all ${
            href
              ? 'cursor-pointer hover:border-[#043658]/30 hover:shadow-md hover:-translate-y-0.5'
              : 'cursor-default'
          }`}
        >
          <Icon
            className={`h-4 w-4 ${
              href
                ? 'text-slate-400 group-hover:text-[#043658] transition-colors'
                : 'text-slate-300'
            }`}
          />
          <span className="font-['Lexend'] text-xl font-bold leading-none text-[#043658]">
            {value}
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            {label}
          </span>
        </button>
      ))}
    </div>
  );
}
