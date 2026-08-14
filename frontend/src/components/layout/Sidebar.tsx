"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Bookmark,
  GraduationCap,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Communities", href: "/community", icon: Users },
  { label: "Posts", href: "/posts", icon: MessageSquare },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

function SidebarInner() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <img 
          src="/logo.png" 
          alt="ServeLink Logo" 
          className="h-10 w-10 object-contain"
        />
        <span className="font-['Lexend'] font-semibold text-white">
          ServeLink
        </span>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
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
    </aside>
  );
}

export function ProfileSidebar() {
  return <SidebarInner />;
}

export function DashboardSidebar() {
  return <SidebarInner />;
}
