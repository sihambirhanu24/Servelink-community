"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Avatar } from "@/components/common/Avatar";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { MessageCircle, Search, User, Settings, LogOut, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { NotificationBell } from "@/components/notification/NotificationBell";

export default function Topbar() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const router = useRouter();

  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";
  const userName = `${firstName} ${lastName}`.trim() || "User";
  const levelLabel = (profile?.level ?? user?.level ?? "").toString().replace(/_/g, " ");
  const profileImage: string | undefined =
    profile?.profileImage ?? user?.profileImage ?? undefined;

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:max-w-sm focus-within:border-[#043658]/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#043658]/10 transition-all">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search communities..."
          aria-label="Search communities"
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-w-0"
        />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/posts"
          aria-label="Create post"
          title="Create Post"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#d6d3d1]/15 text-[#043658] transition-colors hover:bg-[#FFC107]/30 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/50"
        >
        
          <Plus className="h-4.5 w-4.5" aria-hidden="true" />
        </Link>

        {/* <Link
          href="/community/chat"
          aria-label="Open messages"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
        >
          <MessageCircle className="h-5 w-5" />
        </Link> */}

        <NotificationBell />

        <div className="ml-1 h-6 w-px bg-slate-200 sm:ml-2" aria-hidden="true" />

        <Menu as="div" className="relative">
          <Menu.Button
            id="topbar-avatar-btn"
            aria-label="Open account menu"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
          >
            <Avatar
              name={userName}
              profileImage={profileImage}
              size="sm"
              showRing={false}
            />
            <span className="hidden text-sm font-medium text-slate-700 sm:block max-w-[120px] truncate">
              {firstName || userName}
            </span>
            <ChevronDown className="hidden h-3.5 w-3.5 shrink-0 text-slate-400 sm:block" aria-hidden="true" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-lg focus:outline-none z-50 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
                <Avatar
                  name={userName}
                  profileImage={profileImage}
                  size="md"
                  showRing={false}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#043658] leading-tight">
                    {userName}
                  </p>
                  {levelLabel && (
                    <p className="mt-0.5 text-xs text-slate-400 uppercase tracking-wide leading-tight">
                      {levelLabel}
                    </p>
                  )}
                </div>
              </div>

              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="topbar-menu-profile"
                      onClick={() => router.push("/profile")}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors focus:outline-none ${
                        active ? "bg-slate-50 text-[#043658]" : "text-slate-600"
                      }`}
                    >
                      <User className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="topbar-menu-settings"
                      onClick={() => router.push("/settings")}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors focus:outline-none ${
                        active ? "bg-slate-50 text-[#043658]" : "text-slate-600"
                      }`}
                    >
                      <Settings className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Settings
                    </button>
                  )}
                </Menu.Item>
              </div>

              <div className="border-t border-slate-100 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="topbar-menu-logout"
                      onClick={logout}
                      className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors focus:outline-none ${
                        active ? "bg-red-50 text-red-600" : "text-red-500"
                      }`}
                    >
                      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
