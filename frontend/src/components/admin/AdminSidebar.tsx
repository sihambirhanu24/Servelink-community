"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  MessageSquare,
  Flag,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Teachers", href: "/admin/teachers", icon: Users },
  { label: "Communities", href: "/admin/communities", icon: Building2 },
  { label: "Categories", href: "/admin/categories", icon: Tag },
  { label: "Posts", href: "/admin/posts", icon: MessageSquare },
  { label: "Reports", href: "/admin/reports", icon: Flag },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-slate-700 bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-6 lg:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFC107]">
          <GraduationCap className="h-5 w-5 text-[#043658]" />
        </div>
        <div>
          <span className="block font-['Lexend'] font-semibold leading-tight text-white">
            ServeLink
          </span>
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Admin Dashboard
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1" aria-label="Admin navigation">
        {ADMIN_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);

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
