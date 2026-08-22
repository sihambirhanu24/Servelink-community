"use client";

import { useState } from "react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function CommunityPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={false} onClose={() => {}} />
      <Topbar onMenuClick={() => {}} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">
            Community {id}
          </h1>
        </div>
      </main>
    </div>
  );
}