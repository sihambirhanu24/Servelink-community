"use client";

import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { AdminNotificationProvider } from "@/context/AdminNotificationContext";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AdminNotificationProvider>
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="lg:pl-64 mt-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </AdminNotificationProvider>
  );
}

export default AdminLayout;
