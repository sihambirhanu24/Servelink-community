"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  GraduationCap, Building2, ChevronRight, 
  ThumbsUp, MessageCircle, Bell, Loader2 
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface Community {
  id: string;
  name: string;
  type: string;
  _count: {
    communityMembers: number;
  };
}

interface Alert {
  id: string;
  type: "like" | "comment" | "mention";
  user: string;
  message: string;
  time: string;
  read: boolean;
}

export function DashboardRightSidebar() {
  const { user } = useAuth();
  const [alerts] = useState<Alert[]>([
    {
      id: "1",
      type: "like",
      user: "Sarah",
      message: "liked your post",
      time: "10m ago",
      read: false,
    },
    {
      id: "2",
      type: "comment",
      user: "Michael",
      message: "commented",
      time: "1h ago",
      read: false,
    },
  ]);

  // Fetch user's communities
  const { data: communitiesData } = useQuery({
    queryKey: ["dashboard-communities"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/community/accessible", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.json();
    },
  });

  const communities: Community[] = communitiesData || [];
  const totalCommunities = 6; // Based on level system
  const joinedCount = communities.length;
  const progress = (joinedCount / totalCommunities) * 100;

  // Get next community to unlock
  const getNextCommunity = () => {
    const types = ["SCHOOL", "WOREDA", "ZONE", "REGION", "NATIONAL"];
    const joined = new Set(communities.map((c) => c.type));
    const next = types.find((t) => !joined.has(t));
    if (!next) return "All Unlocked";
    return next.charAt(0) + next.slice(1).toLowerCase() + " Community";
  };

  // Fetch engagement stats (likes and comments received)
  const { data: statsData } = useQuery({
    queryKey: ["user-engagement-stats"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5000/api/profile/posts", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const posts = await response.json();
      
      const likes = posts.reduce((sum: number, post: any) => 
        sum + (post.likesCount || post.communityLikes?.length || 0), 0
      );
      const comments = posts.reduce((sum: number, post: any) => 
        sum + (post.comments?.length || 0), 0
      );
      
      return { likes, comments };
    },
  });

  return (
    <div className="space-y-6">
      {/* Communities Progress */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#043658]">Communities</h3>
          <span className="text-xs font-semibold text-[#043658]">
            {joinedCount} / {totalCommunities} Joined
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 h-2 w-full rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#043658] to-[#065a8f] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mb-4 text-xs text-slate-600">
          Next unlock: <span className="font-semibold text-[#043658]">{getNextCommunity()}</span>
        </p>

        <Link
          href="/community/chat"
          className="block w-full rounded-lg border-2 border-[#043658] py-2.5 text-center text-sm font-semibold text-[#043658] transition-all hover:bg-[#043658] hover:text-white"
        >
          View Communities
        </Link>
      </div>

      {/* Engagement Stats */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-base font-bold text-[#043658]">Engagement</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {/* Likes Received */}
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-4 text-center">
            <div className="mb-2 flex justify-center">
              <div className="rounded-full bg-white p-2">
                <ThumbsUp className="h-4 w-4 text-[#043658]" />
              </div>
            </div>
            {statsData ? (
              <>
                <p className="text-2xl font-bold text-[#043658]">{statsData.likes}</p>
                <p className="text-xs font-medium text-slate-600">LIKES RCVD</p>
              </>
            ) : (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#043658]" />
            )}
          </div>

          {/* Comments Received */}
          <div className="rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 p-4 text-center">
            <div className="mb-2 flex justify-center">
              <div className="rounded-full bg-white p-2">
                <MessageCircle className="h-4 w-4 text-[#043658]" />
              </div>
            </div>
            {statsData ? (
              <>
                <p className="text-2xl font-bold text-[#043658]">{statsData.comments}</p>
                <p className="text-xs font-medium text-slate-600">COMMENTS</p>
              </>
            ) : (
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#043658]" />
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-bold text-[#043658]">Alerts</h3>
          {alerts.filter((a) => !a.read).length > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {alerts.filter((a) => !a.read).length}
            </span>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex-shrink-0">
                  {alert.type === "like" ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <ThumbsUp className="h-4 w-4 text-blue-600" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#043658]">
                    <span className="font-semibold">{alert.user}</span>{" "}
                    {alert.message}
                  </p>
                  <p className="text-xs text-slate-500">{alert.time}</p>
                </div>
                {!alert.read && (
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                )}
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center">
              <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No new alerts</p>
            </div>
          )}
        </div>

        <Link
          href="/notifications"
          className="block border-t border-slate-100 px-5 py-3 text-center text-xs font-semibold text-[#043658] transition-colors hover:bg-slate-50"
        >
          View All Notifications
        </Link>
      </div>

      {/* Suggested Communities */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-bold text-[#043658]">Suggested Communities</h3>
          <p className="mt-0.5 text-xs text-slate-500">Communities you can join</p>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            { name: "Physics Teachers", type: "School", members: 1 },
            { name: "General Community", type: "School", members: 4 },
            { name: "Woreda 04 Teachers", type: "Woreda", members: 1 },
          ].map((community, idx) => (
            <div key={idx} className="flex items-center gap-3 px-5 py-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#043658]/10">
                {community.type === "School" ? (
                  <GraduationCap className="h-4 w-4 text-[#043658]" />
                ) : (
                  <Building2 className="h-4 w-4 text-[#043658]" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#043658]">
                  {community.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium">
                    {community.type}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="text-slate-400">👥</span>
                    {community.members}
                  </span>
                </div>
              </div>

              <button className="flex-shrink-0 rounded-lg border border-[#043658] px-3 py-1.5 text-xs font-semibold text-[#043658] transition-colors hover:bg-[#043658] hover:text-white">
                Join
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Communities */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h3 className="text-base font-bold text-[#043658]">Trending Communities</h3>
        </div>

        <div className="divide-y divide-slate-100">
          {[
            { name: "Adama Science and Tech...", members: 0 },
            { name: "Adama Woreda Teachers", members: 0 },
          ].map((community, idx) => (
            <Link
              key={idx}
              href="#"
              className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                <Building2 className="h-4 w-4 text-slate-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[#043658]">
                  {community.name}
                </p>
                <p className="text-xs text-slate-500">{community.members} members</p>
              </div>

              <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
