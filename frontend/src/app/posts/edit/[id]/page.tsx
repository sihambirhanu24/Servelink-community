"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { getPostById } from "@/services/community";
import EditPostForm from "@/components/post/EditPostForm";

export default function EditPostPage() {
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
          <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 sm:px-8">
            <div className="mx-auto max-w-[900px] animate-pulse space-y-8">
              <div className="h-64 rounded-3xl bg-[#043658]/15" />
              <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
                <div className="h-6 w-32 rounded bg-slate-200" />
                <div className="h-14 rounded-2xl bg-slate-100" />
                <div className="h-52 rounded-2xl bg-slate-100" />
                <div className="grid gap-5 sm:grid-cols-2"><div className="h-14 rounded-2xl bg-slate-100" /><div className="h-14 rounded-2xl bg-slate-100" /></div>
              </div>
            </div>
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
          <EditPostForm post={post} />
        </div>
      </main>
    </div>
  );
}