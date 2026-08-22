"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import Feed from "@/components/community/feed/Feed";

export default function BookmarkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-[#043658]">
                Saved Posts
              </h1>
              <p className="text-gray-500">
                Posts you've bookmarked.
              </p>
            </div>
            <Feed />
          </div>
        </div>
      </main>
    </div>
  );
}