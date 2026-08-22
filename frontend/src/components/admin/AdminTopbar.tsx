"use client";

import { Fragment } from "react";

import { Menu, Transition } from "@headlessui/react";

import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Search,
  Settings,
  User,
  MenuIcon,
  Megaphone,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

import { useProfile } from "@/hooks/useProfile";

import { Avatar } from "@/components/common/Avatar";

import { NotificationBell } from "@/components/notification/NotificationBell";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export default function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const router = useRouter();

  // Use real authenticated user/profile data
  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";
  const fullName =
    `${firstName} ${lastName}`.trim() || "Administrator";
  const profileImage =
    profile?.profileImage ?? user?.profileImage ?? undefined;

  return (
    <header
      className="
        fixed
        top-0
        right-0
        left-0
        lg:left-64
        z-40
        h-16
        border-b
        border-white/10
        bg-[#043658]
        shadow-sm
      "
    >
      <div className="flex h-full items-center justify-between px-3 sm:px-4 lg:px-8 gap-2 sm:gap-4">
        {/* ================= LEFT ================= */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4 flex-1">
          {/* Hamburger Menu Button (Mobile) */}
          {onMenuClick && (
            <button
              onClick={onMenuClick}
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-lg text-white hover:bg-white/10 transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          )}

          {/* Mobile title */}
          <div className="lg:hidden min-w-0">
            <p className="text-sm font-bold text-white truncate">
              ServeLink
            </p>
            <p className="text-[10px] text-white/60">
              Admin Dashboard
            </p>
          </div>
          {/* Desktop search */}
          <div
            className="
              hidden
              sm:flex
              w-48
              md:w-64
              lg:w-80
              items-center
              gap-2
              rounded-xl
              border
              border-white/15
              bg-white/10
              px-3
              py-2
              transition-all
              focus-within:border-[#FFC107]
              focus-within:bg-white/15
              focus-within:ring-2
              focus-within:ring-[#FFC107]/20
            "
          >
            <Search
              className="h-4 w-4 shrink-0 text-white/60"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search teachers, communities..."
              aria-label="Search teachers and communities"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-sm
                text-white
                outline-none
                placeholder:text-white/50
              "
            />
          </div>
        </div>
        {/* ================= RIGHT ================= */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Mobile search */}
          <button
            type="button"
            aria-label="Search"
            title="Search"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-white/70
              transition
              hover:bg-white/10
              hover:text-[#FFC107]
              sm:hidden
            "
          >
            <Search className="h-5 w-5" />
          </button>
          {/* Quick action — dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button
              type="button"
              aria-label="Quick actions"
              title="Quick Actions"
              className="
                flex
                h-9
                w-9
                sm:h-10
                sm:w-10
                items-center
                justify-center
                rounded-xl
                bg-[#FFC107]
                text-[#043658]
                shadow-sm
                transition-all
                hover:bg-[#FFD54F]
                hover:shadow-md
                hover:-translate-y-[1px]
                focus:outline-none
                focus:ring-2
                focus:ring-[#FFC107]
                focus:ring-offset-2
                focus:ring-offset-[#043658]
              "
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
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
              <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Create</p>
                </div>
                <div className="p-1.5">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => router.push('/admin/announcements')}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          active ? 'bg-[#043658]/5 text-[#043658]' : 'text-slate-600'
                        }`}
                      >
                        <Megaphone className="h-4 w-4 text-[#043658]" />
                        Create Announcement
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
          {/* Notification */}
          <div
            className="
              flex
              items-center
              justify-center
              rounded-lg
              text-white
            "
          >
            <NotificationBell />
          </div>
          {/* Divider */}
          <div
            className="mx-1 hidden h-7 w-px bg-white/15 sm:block"
            aria-hidden="true"
          />
          {/* ================= PROFILE ================= */}
          <Menu as="div" className="relative">
            <Menu.Button
              id="admin-topbar-profile"
              aria-label="Open administrator account menu"
              className="
                flex
                items-center
                gap-1.5
                sm:gap-2
                rounded-xl
                px-1.5
                sm:px-2
                py-1.5
                transition
                hover:bg-white/10
                focus:outline-none
                focus:ring-2
                focus:ring-[#FFC107]/50
              "
            >
              {/* Avatar */}
              <div
                className="
                  rounded-full
                  border-2
                  border-[#FFC107]
                  p-[1px]
                "
              >
                <Avatar
                  name={fullName}
                  profileImage={profileImage}
                  size="sm"
                  showRing={false}
                />
              </div>
              {/* Name */}
              <div className="hidden text-left md:block">
                <p className="max-w-[100px] truncate text-sm font-semibold text-white">
                  {firstName || "Admin"}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-white/50">
                  Administrator
                </p>
              </div>
              <ChevronDown
                className="
                  hidden
                  h-4
                  w-4
                  text-white/60
                  transition
                  md:block
                "
              />
            </Menu.Button>
            {/* ================= DROPDOWN ================= */}
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items
                className="
                  absolute
                  right-0
                  mt-2
                  w-60
                  origin-top-right
                  overflow-hidden
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  shadow-xl
                  focus:outline-none
                "
              >
                {/* User information */}
                <div
                  className="
                    flex
                    items-center
                    gap-3
                    border-b
                    border-slate-100
                    bg-slate-50
                    px-4
                    py-4
                  "
                >
                  <Avatar
                    name={fullName}
                    profileImage={profileImage}
                    size="md"
                    showRing={false}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#043658]">
                      {fullName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Administrator
                    </p>
                  </div>
                </div>
                {/* Menu items */}
                <div className="p-1.5">
                  {/* Profile */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => router.push("/admin/profile")}
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          transition
                          ${
                            active
                              ? "bg-[#043658]/5 text-[#043658]"
                              : "text-slate-600"
                          }
                        `}
                      >
                        <User
                          className="
                            h-4
                            w-4
                            text-[#043658]
                          "
                        />
                        <span>Profile</span>
                      </button>
                    )}
                  </Menu.Item>
                  {/* Settings */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => router.push("/admin/settings")}
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          transition
                          ${
                            active
                              ? "bg-[#FFC107]/10 text-[#043658]"
                              : "text-slate-600"
                          }
                        `}
                      >
                        <Settings
                          className="
                            h-4
                            w-4
                            text-[#043658]
                          "
                        />
                        <span>Settings</span>
                      </button>
                    )}
                  </Menu.Item>
                  {/* Notifications */}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={() => router.push("/admin/notifications")}
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          transition
                          ${
                            active
                              ? "bg-[#FFC107]/10 text-[#043658]"
                              : "text-slate-600"
                          }
                        `}
                      >
                        <Bell
                          className="
                            h-4
                            w-4
                            text-[#043658]
                          "
                        />
                        <span>Notifications</span>
                      </button>
                    )}
                  </Menu.Item>
                </div>
                {/* Logout */}
                <div className="border-t border-slate-100 p-1.5">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={logout}
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-lg
                          px-3
                          py-2.5
                          text-left
                          text-sm
                          transition
                          ${
                            active
                              ? "bg-red-50 text-red-600"
                              : "text-red-500"
                          }
                        `}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}
