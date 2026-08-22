"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getPostById } from "@/services/community";
import ViewPost from "@/components/post/ViewPost";

export default function Page() {
  const { id } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [post, setPost] = useState<any>();

  useEffect(() => {
    loadPost();
  }, []);

  async function loadPost() {
    try {
      const data = await getPostById(id as string);
      setPost(data);
    } catch (error) {
      console.log(error);
    }
  }

  if (!post) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex h-full items-center justify-center">
            Loading...
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <ViewPost post={post} />
        </div>
      </main>
    </div>
  );
}