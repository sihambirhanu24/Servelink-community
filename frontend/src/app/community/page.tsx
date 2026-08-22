"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useVerification } from "@/hooks/useVerification";
import { getPosts, getCommunities, getCategories } from "@/services/community";
import { getSavedPosts, getMyCommunitiesPosts } from "@/services/community-posts.service";
import PostCard from "@/components/post/PostCard";
import { CommunitySideRail } from "@/components/community/CommunitySideRail";
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityFilters } from "@/components/community/CommunityFilters";

type Tab = "all" | "following" | "my-communities" | "saved";

export default function CommunityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { status } = useVerification();
  const isVerified = status?.verificationStatus === "APPROVED";

  const communitiesQuery = useQuery({
    queryKey: ["communities"],
    queryFn: getCommunities,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  // Query based on tab
  const postsQuery = useQuery({
    queryKey: ["community-feed", tab, search, communityFilter, categoryFilter],
    queryFn: async () => {
      if (tab === "saved") {
        const data = await getSavedPosts();
        return data ?? [];
      }
      if (tab === "my-communities") {
        const data = await getMyCommunitiesPosts();
        return data ?? [];
      }
      if (tab === "following") {
        // Following not implemented - return empty array
        return [];
      }
      // Default: all posts
      const params: any = { page: 1, limit: 20 };
      if (search) params.search = search;
      if (communityFilter !== "all") params.communityId = communityFilter;
      if (categoryFilter !== "all") params.categoryId = categoryFilter;
      const { data } = await getPosts(params);
      return data ?? [];
    },
  });

  const posts = postsQuery.data ?? [];

  const firstName = profile?.firstName ?? user?.firstName ?? "";
  const lastName = profile?.lastName ?? user?.lastName ?? "";
  const name = `${firstName} ${lastName}`.trim() || "Teacher";
  const profileImage = profile?.profileImage ?? user?.profileImage ?? undefined;

  const handleCreatePost = () => {
    if (!isVerified) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("show-verification-modal"));
      }
      return;
    }
    window.location.href = "/community/posts";
  };

  const getEmptyStateMessage = () => {
    switch (tab) {
      case "saved":
        return {
          title: "No saved posts yet",
          message: "Bookmark posts to save them for later.",
        };
      case "my-communities":
        return {
          title: "No posts from your communities",
          message: "Join communities to see posts from other teachers.",
        };
      case "following":
        return {
          title: "Following feature coming soon",
          message: "The follow feature will be available in a future update.",
        };
      default:
        return {
          title: "No posts yet",
          message: "Be the first teacher to start a discussion or share a resource.",
        };
    }
  };

  const emptyState = getEmptyStateMessage();

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          {/* Header */}
          <CommunityHeader
            userName={name}
            profileImage={profileImage}
            level={profile?.level}
            isVerified={isVerified}
            onCreatePost={handleCreatePost}
          />

          {/* Filter Bar */}
          <CommunityFilters
            tab={tab}
            setTab={setTab}
            search={search}
            setSearch={setSearch}
            communityFilter={communityFilter}
            setCommunityFilter={setCommunityFilter}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            communities={communitiesQuery.data ?? []}
            categories={categoriesQuery.data ?? []}
          />

          {/* Feed */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-4">
              {postsQuery.isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-200" />
                        <div className="space-y-2">
                          <div className="h-4 w-32 rounded bg-slate-200" />
                          <div className="h-3 w-48 rounded bg-slate-200" />
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                        <div className="h-4 w-full rounded bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : postsQuery.isError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                  We could not load posts right now. Please try again.
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
                  <TrendingUp className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-semibold text-[#043658]">{emptyState.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{emptyState.message}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post: any) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-0 h-fit">
                <CommunitySideRail />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
