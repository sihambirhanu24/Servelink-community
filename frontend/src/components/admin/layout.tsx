import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-50">
      <AdminSidebar />
      <AdminTopbar />
      <main className="lg:pl-64 mt-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
