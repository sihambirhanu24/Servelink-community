"use client";

import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";

export interface CommunityTypeHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  teacherName?: string;
  createHref?: string;
}

export default function CommunityTypeHero({
  eyebrow,
  title,
  subtitle,
  teacherName,
  createHref = "/community/create",
}: CommunityTypeHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#043658_0%,#0A4A74_100%)] p-6 shadow-[0_20px_45px_-24px_rgba(4,54,88,0.75)] sm:p-10">
      {/* decorative blobs */}
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border border-white/10 bg-white/[0.04]" />
      <div className="absolute -bottom-32 right-24 h-64 w-64 rounded-full border border-[#FFC107]/10" />

      <div className="relative">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#FFC107]">
              {eyebrow}
            </p>
            <h1 className="mt-4 font-['Lexend'] text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            {teacherName && (
              <p className="mt-2 text-sm font-medium text-[#FFC107]">{teacherName}</p>
            )}
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
              {subtitle}
            </p>
          </div>


        </div>
      </div>
    </section>
  );
}
