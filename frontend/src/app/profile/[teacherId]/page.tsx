"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { TeacherProfileHeader } from "@/components/profile/TeacherProfileHeader";
import { TeacherProfileTabs } from "@/components/profile/TeacherProfileTabs";
import { TeacherPostGrid } from "@/components/profile/TeacherPostGrid";
import { useTeacherProfile, useFollowTeacher } from "@/hooks/useTeacherProfile";
import { useTeacherPosts } from "@/hooks/useTeacherPosts";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Loader } from "lucide-react";

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const { user } = useAuth();
  
  const teacherId = params.teacherId as string;
  const isCurrentUser = user?.id === teacherId;

  const { data: profile, isLoading: profileLoading, error: profileError } = useTeacherProfile(teacherId);
  const { follow, unfollow, isFollowing } = useFollowTeacher(teacherId);
  const { data: postsData, isLoading: postsLoading } = useTeacherPosts(teacherId);

  if (profileLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto text-[#043658] mb-4" />
            <p className="text-sm text-slate-500">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (profileError || !profile) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Profile Not Found</h2>
            <p className="text-sm text-slate-500 mb-6">This teacher profile could not be found.</p>
            <button
              onClick={() => router.push("/community")}
              className="px-4 py-2 bg-[#043658] text-white rounded-lg text-sm font-medium hover:bg-[#032742] transition"
            >
              Back to Community
            </button>
          </div>
        </main>
      </div>
    );
  }

  const handlePostClick = (postId: string) => {
    router.push(`/posts/${postId}`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        return (
          <TeacherPostGrid
            posts={postsData?.posts ?? []}
            isLoading={postsLoading}
            onPostClick={handlePostClick}
          />
        );
      case "resources":
        return (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-sm font-semibold text-slate-700">No resources published yet</p>
            <p className="text-xs text-slate-500 mt-1">This teacher hasn't shared any resources.</p>
          </div>
        );
      case "lessons":
        return (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">
            <div className="text-4xl mb-4">📖</div>
            <p className="text-sm font-semibold text-slate-700">No lessons published yet</p>
            <p className="text-xs text-slate-500 mt-1">This teacher hasn't published any lessons.</p>
          </div>
        );
      case "about":
        return (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-[#043658] mb-4">About {profile.firstName}</h3>
            {profile.bio ? (
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-slate-500">No bio information available.</p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-slate-700">Profession</p>
                <p className="text-slate-600">{profile.profession || "Not specified"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Department</p>
                <p className="text-slate-600">{profile.department || "Not specified"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">School</p>
                <p className="text-slate-600">{profile.school}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Level</p>
                <p className="text-slate-600">{profile.level.replace(/^LEVEL_/, "Level ").replace(/_/g, " ")}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Region</p>
                <p className="text-slate-600">{profile.region || "Not specified"}</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Woreda</p>
                <p className="text-slate-600">{profile.woreda || "Not specified"}</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <TeacherProfileHeader
            profile={profile}
            onFollow={follow}
            onUnfollow={unfollow}
            isFollowing={profile.isFollowedByCurrentUser}
            isCurrentUser={isCurrentUser}
          />

          <div className="mt-6">
            <TeacherProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
