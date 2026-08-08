"use client";

import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F7FB]">

      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main */}
      <div className="ml-0 flex flex-1 flex-col lg:ml-64">

        <Topbar />

        <main className="min-w-0 flex-1 mt-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>

      </div>

    </div>
  );
}