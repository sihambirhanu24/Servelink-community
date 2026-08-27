"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ProfileHeaderCard } from "@/components/profile/ProfileHeaderCard";
import { TeacherInfoCard } from "@/components/profile/TeacherInfoCard";
import { RecentPostsCard } from "@/components/profile/RecentPostsCard";
import { ProgressCard } from "@/components/progress/ProgressCard";
import { PointsHistory } from "@/components/progress/PointsHistory";
import { CommunityAccessListCard } from "@/components/profile/CommunityAccessListCard";
import { LocationChangeModal } from "@/components/profile/LocationChangeModal";
import { useLocationChangeRequests } from "@/hooks/useLocationChangeRequests";
import SuspensionBanner from "@/components/SuspensionBanner";
import SuspensionDetailsCard from "@/components/profile/SuspensionDetailsCard";

async function getDashboard() {
  const { data } = await (await import("@/lib/axios")).default.get("/dashboard");
  return data;
}

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { token, isInitializing } = useAuth();
  const authReady = !isInitializing && !!token;

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30_000,
    enabled: authReady,
  });

  const { data: locationRequests } = useLocationChangeRequests();
  const pendingRequest = locationRequests?.find(
    (r: any) => r.status === "PENDING"
  );
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // While auth is still booting, show a neutral spinner rather than the
  // "could not load your profile" error (which was triggered when the
  // unguarded query fired unauthenticated and received a 401).
  if (isInitializing || profileLoading || dashboardLoading) {
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
              {/* Suspension Banner */}
              <SuspensionBanner />

              {/* Profile Header */}
              <ProfileHeaderCard
                profile={profile}
                name={name}
                stats={{
                  posts:     stats?.posts     ?? 0,
                  likes:     stats?.likes     ?? 0,
                  resources: stats?.resources ?? 0,
                }}
                pendingLocationRequest={!!pendingRequest}
                onRequestLocationChange={() => setIsLocationModalOpen(true)}
              />

              {/* Suspension Details Card */}
              <SuspensionDetailsCard />

              {/* Teacher Information */}
              <TeacherInfoCard profile={profile} />

              {/* Recent Posts */}
              <RecentPostsCard />
            </div>

            {/* ─── Right Column ────────────────────────────────────────── */}
            <div className="space-y-4 sm:space-y-6">
              {/* Progress Card */}
              <ProgressCard />

              {/* Points History */}
              <PointsHistory limit={10} />

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
