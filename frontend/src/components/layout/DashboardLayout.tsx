import { ProfileSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <ProfileSidebar />
      <Topbar />

      <main className="lg:ml-64 mt-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}