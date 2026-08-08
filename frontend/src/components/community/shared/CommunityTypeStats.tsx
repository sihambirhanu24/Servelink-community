"use client";

import { LucideIcon } from "lucide-react";

export interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
}

interface Props {
  stats: StatItem[];
}

export default function CommunityTypeStats({ stats }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-[28px] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <Icon size={28} className={stat.color ?? "text-[#043658]"} />
              <span className="text-xs font-semibold text-emerald-500">Live</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[#043658]">
              {stat.value}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
