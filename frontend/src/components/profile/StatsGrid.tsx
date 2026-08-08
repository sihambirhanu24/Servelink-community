"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Heart, FolderOpen, ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { getMyPosts } from "@/services/profile";

interface StatsGridProps {
  /** Fallback value from the dashboard call — used while React Query resolves. */
  posts?: number;
  likes?: number;
  resources?: number;
}

interface StatCard {
  icon: LucideIcon;
  value: number;
  label: string;
  sublabel: string;
  href?: string;
  color: string;
  bg: string;
}

export function StatsGrid({ posts: fallbackPosts = 0, likes = 0, resources = 0 }: StatsGridProps) {
  const { data: myPosts = [] } = useQuery({
    queryKey: ["my-posts"],
    queryFn: getMyPosts,
  });

  const postCount = useMemo(() => (myPosts as any[]).length, [myPosts]);
  const totalLikes = useMemo(
    () =>
      (myPosts as any[]).reduce(
        (sum: number, post: any) => sum + (post.communityLikes?.length ?? post.likesCount ?? 0),
        0
      ),
    [myPosts]
  );

  const stats: StatCard[] = [
    {
      icon: FileText,
      value: postCount || fallbackPosts,
      label: "Posts Published",
      sublabel: "Click to view all",
      href: "/profile/posts",
      color: "text-[#043658]",
      bg: "bg-[#043658]/10",
    },
    {
      icon: Heart,
      value: totalLikes || likes,
      label: "Likes Received",
      sublabel: "Across all posts",
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      icon: FolderOpen,
      value: resources,
      label: "Resources Shared",
      sublabel: "PDFs, docs & files",
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => {
        const inner = (
          <div
            className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200
              ${stat.href ? "hover:-translate-y-0.5 hover:border-[#043658]/30 hover:shadow-md cursor-pointer" : ""}
            `}
          >
            {/* Icon */}
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>

            {/* Value */}
            <p className={`mt-4 font-['Lexend'] text-3xl font-bold ${stat.color}`}>
              {stat.value}
            </p>

            {/* Label */}
            <p className="mt-1 text-sm font-semibold text-slate-700">{stat.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{stat.sublabel}</p>

            {/* Arrow hint for clickable cards */}
            {stat.href ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <ArrowRight className="h-4 w-4 text-[#043658]" />
              </div>
            ) : null}
          </div>
        );

        return stat.href ? (
          <Link key={stat.label} href={stat.href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={stat.label}>{inner}</div>
        );
      })}
    </div>
  );
}