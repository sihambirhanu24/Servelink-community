"use client";

import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FB]">

      {/* Sidebar */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main */}
      <div className="flex flex-1 flex-col lg:ml-64">

        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-w-0 flex-1 mt-16 h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}
