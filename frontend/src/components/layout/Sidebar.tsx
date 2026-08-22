"use client";

import { Fragment, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bookmark,
  X,
  ChevronDown,
  Building2,
  MapPin,
  Map,
  Globe2,
  Globe,
  Lock,
} from "lucide-react";
import { getCommunityAccess } from "@/services/community";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const COMMUNITY_ITEMS = [
  { label: "Network Community", href: "/community", icon: Users, type: "NETWORK" },
  { label: "School Community", href: "/community/type/school", icon: Building2, type: "SCHOOL" },
  { label: "Woreda Community", href: "/community/type/woreda", icon: MapPin, type: "WOREDA" },
  { label: "Zone Community", href: "/community/type/zone", icon: Map, type: "ZONE" },
  { label: "Region Community", href: "/community/type/region", icon: Globe2, type: "REGION" },
  { label: "National Community", href: "/community/type/national", icon: Globe, type: "NATIONAL" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [communitiesExpanded, setCommunitiesExpanded] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/community")) {
      setCommunitiesExpanded(true);
    }
  }, [pathname]);

  const { data: accessData } = useQuery({
    queryKey: ["community-access"],
    queryFn: getCommunityAccess,
    staleTime: 60_000,
  });

  const unlockedTypes = new Set(accessData?.unlockedTypes || []);
  unlockedTypes.add("NETWORK");

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="ServeLink Logo"
            className="h-10 w-10 object-contain"
          />
          <span className="font-['Lexend'] font-semibold text-white">
            ServeLink
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]/30 ${
            pathname === "/dashboard"
              ? "border-l-2 border-[#FFC107] bg-white/10 font-medium text-white"
              : "border-l-2 border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <LayoutDashboard className={`h-5 w-5 shrink-0 ${pathname === "/dashboard" ? "text-[#FFC107]" : "text-slate-400"}`} />
          Dashboard
        </Link>

        <div className="space-y-1 py-1">
          <button
            onClick={() => setCommunitiesExpanded(!communitiesExpanded)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]/30 ${
              pathname.startsWith("/community") && !communitiesExpanded
                ? "border-l-2 border-[#FFC107] bg-white/10 font-medium text-white"
                : "border-l-2 border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className={`h-5 w-5 shrink-0 ${pathname.startsWith("/community") && !communitiesExpanded ? "text-[#FFC107]" : "text-slate-400"}`} />
              <span>Communities</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                communitiesExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              communitiesExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="mt-1 space-y-1 pl-4 pr-1 pb-1">
              {COMMUNITY_ITEMS.map(({ label, href, icon: Icon, type }) => {
                const isActive = pathname === href;
                const isUnlocked = unlockedTypes.has(type);

                return isUnlocked ? (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    title={label}
                    className={`group flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-white/5 ${
                      isActive
                        ? "bg-white/10 text-white font-medium border-l-[3px] border-[#FFC107]"
                        : "text-slate-300 border-l-[3px] border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                        isActive ? "bg-[#FFC107]/15" : "bg-white/5 group-hover:bg-white/10"
                      }`}>
                        <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#FFC107]" : "text-slate-400"}`} />
                      </div>
                      <span className="truncate">{label}</span>
                    </div>
                  </Link>
                ) : (
                  <div
                    key={href}
                    title="Unlock this community by completing the required teacher level."
                    className="flex cursor-not-allowed items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 opacity-60 border-l-[3px] border-transparent"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/5">
                        <Icon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="truncate">{label}</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Link
          href="/posts"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]/30 ${
            pathname.startsWith("/posts")
              ? "border-l-2 border-[#FFC107] bg-white/10 font-medium text-white"
              : "border-l-2 border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <MessageSquare className={`h-5 w-5 shrink-0 ${pathname.startsWith("/posts") ? "text-[#FFC107]" : "text-slate-400"}`} />
          Posts
        </Link>

        <Link
          href="/bookmarks"
          onClick={onClose}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]/30 ${
            pathname.startsWith("/bookmarks")
              ? "border-l-2 border-[#FFC107] bg-white/10 font-medium text-white"
              : "border-l-2 border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Bookmark className={`h-5 w-5 shrink-0 ${pathname.startsWith("/bookmarks") ? "text-[#FFC107]" : "text-slate-400"}`} />
          Bookmarks
        </Link>
      </nav>
    </>
  );
}

function SidebarInner({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-700 bg-primary px-4 py-6 lg:flex">
        <SidebarContent />
      </aside>

      <Transition.Root show={isOpen || false} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose || (() => { })}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-700 bg-primary px-4 py-6">
                  <SidebarContent onClose={onClose} />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  );
}

export function ProfileSidebar({ isOpen = false, onClose }: SidebarProps) {
  return <SidebarInner isOpen={isOpen} onClose={onClose} />;
}

export function DashboardSidebar({ isOpen = false, onClose }: SidebarProps) {
  return <SidebarInner isOpen={isOpen} onClose={onClose} />;
}
