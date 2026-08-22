"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { TeacherInfoCard } from "@/components/profile/TeacherInfoCard";
import { AccountStatusCard } from "@/components/profile/AccountStatusCard";
import { VerificationStatusCard } from "@/components/profile/VerificationStatusCard";
import { RecentPostsCard } from "@/components/profile/RecentPostsCard";
import { StatsGrid } from "@/components/profile/StatsGrid";
import { ProgressCard } from "@/components/progress/ProgressCard";
import { CommunityAccessListCard } from "@/components/profile/CommunityAccessListCard";
import { LocationChangeModal } from "@/components/profile/LocationChangeModal";
import { useLocationChangeRequests } from "@/hooks/useLocationChangeRequests";

async function getDashboard() {
  const { data } = await (await import("@/lib/axios")).default.get("/dashboard");
  return data;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30_000,
  });

  const { data: locationRequests } = useLocationChangeRequests();
  const pendingRequest = locationRequests?.find(
    (r: any) => r.status === "PENDING"
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  if (profileLoading || dashboardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FB] text-slate-500 text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading profile…
      </div>
    );
  }

  if (!profile || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8FB] text-red-600 text-sm">
        We could not load your profile. Please refresh.
      </div>
    );
  }

  const teacher = dashboard.teacher;
  const stats = dashboard.stats;
  const name = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* ─── Left Column ─────────────────────────────────────────── */}
            <div className="space-y-4 sm:space-y-6 lg:col-span-2">
              {/* Profile Header */}
              <ProfileHeaderCard
                profile={profile}
                name={name}
                pendingLocationRequest={!!pendingRequest}
                onRequestLocationChange={() => setIsLocationModalOpen(true)}
              />

              {/* Stats */}
              <StatsGrid
                posts={stats?.posts ?? 0}
                likes={stats?.likes ?? 0}
                resources={stats?.resources ?? 0}
              />

              {/* Teacher Information */}
              <TeacherInfoCard profile={profile} />

              {/* Account Status / Profile Completeness */}
              <AccountStatusCard profile={profile} />
            </div>

            {/* ─── Right Column ────────────────────────────────────────── */}
            <div className="space-y-4 sm:space-y-6">
              {/* Verification Status Card — MUST be above Recent Posts */}
              <VerificationStatusCard profile={profile} />

              {/* Recent Posts */}
              <RecentPostsCard />

              {/* Progress Card */}
              <ProgressCard />

              {/* Community Access */}
              <CommunityAccessListCard
                communityAccess={dashboard.communityAccess}
              />
            </div>
          </div>
        </div>
      </main>

      <LocationChangeModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}
