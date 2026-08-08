"use client";

import { useRouter } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { Search, Shield, LogOut, ChevronDown } from "lucide-react";
import { adminLogout, getStoredAdmin } from "@/services/auth";

export default function AdminTopbar() {
  const router = useRouter();
  const admin = getStoredAdmin();
  const adminName = admin?.name ?? "Admin";

  function handleLogout() {
    adminLogout();
    router.push("/admin/login");
  }

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8">

      <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 sm:max-w-sm focus-within:border-[#043658]/40 focus-within:bg-white focus-within:ring-2 focus-within:ring-[#043658]/10 transition-all">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          placeholder="Search..."
          aria-label="Search"
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-w-0"
        />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="ml-1 h-6 w-px bg-slate-200 sm:ml-2" aria-hidden="true" />

        <Menu as="div" className="relative">
          <Menu.Button
            id="admin-topbar-avatar-btn"
            aria-label="Open admin account menu"
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-semibold text-white">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 sm:block max-w-[120px] truncate">
              {adminName}
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#043658] text-sm font-semibold text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#043658] leading-tight">
                    {adminName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400 leading-tight">
                    <Shield className="h-3 w-3" aria-hidden="true" />
                    Administrator
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      id="admin-topbar-logout"
                      onClick={handleLogout}
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
