"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bookmark,
  GraduationCap,
  Bell,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Communities", href: "/community", icon: Users },
  { label: "Posts", href: "/posts", icon: MessageSquare },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

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
        {/* Close button for mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FFC107]/30 ${
                active
                  ? "border-l-2 border-[#FFC107] bg-slate-700/50 font-medium text-[#FFC107]"
                  : "text-slate-300 hover:bg-slate-700/30 hover:text-[#FFC107]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function SidebarInner({ isOpen = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar - Fixed */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar - Drawer */}
      <Transition.Root show={isOpen || false} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose || (() => {})}>
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
                <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6">
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
