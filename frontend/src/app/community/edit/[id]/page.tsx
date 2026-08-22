"use client";

import { useState } from "react";
import { CreatePostForm } from "@/components/community/create";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function EditPostPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-8 text-4xl font-bold">
            Edit Post
          </h1>

          <CreatePostForm />
        </div>
      </main>
    </div>
  );
}