"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import api from "@/lib/axios";

interface Community {
  id: string;
  name: string;
  type: string;
  subtype: string;
  department: string | null;
  description: string | null;
  school: string | null;
  woreda: string | null;
  zone: string | null;
  region: string | null;
}

interface ChatRoomInfo {
  community: Community;
  chatRoomId: string;
}

async function getChatRoomInfo(communityId: string): Promise<ChatRoomInfo> {
  const { data } = await api.get(`/community/${communityId}/chat/info`);
  return data;
}

export default function ChatRoomPage() {
  const params = useParams();
  const communityId = params.communityId as string;

  const { data: chatInfo, isLoading, isError } = useQuery({
    queryKey: ["chat-room-info", communityId],
    queryFn: () => getChatRoomInfo(communityId),
    enabled: !!communityId,
  });

  const getCommunityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SCHOOL: "School",
      WOREDA: "Woreda",
      ZONE: "Zone",
      REGION: "Region",
      NATIONAL: "National",
    };
    return labels[type] || type;
  };

  const getSubtypeLabel = (subtype: string, department: string | null) => {
    if (subtype === "DEPARTMENT" && department) {
      return `${department} Department`;
    }
    return "General Community";
  };

  if (isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-[#F5F8FB] via-[#F5F8FB] to-[#E8F0F7]">
        <DashboardSidebar />
        <Topbar />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
          </div>
        </main>
      </div>
    );
  }

  if (isError || !chatInfo) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-[#F5F8FB] via-[#F5F8FB] to-[#E8F0F7]">
        <DashboardSidebar />
        <Topbar />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#043658] mb-2">Chat Room Not Available</h2>
              <p className="text-sm text-slate-600 mb-6">
                You don't have access to this chat room or it doesn't exist.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#043658] text-white rounded-xl font-semibold hover:bg-[#032d4a] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#F5F8FB] via-[#F5F8FB] to-[#E8F0F7]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-[#043658] hover:text-[#043658] transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-[#043658]">
                  {getCommunityTypeLabel(chatInfo.community.type)} Chat
                </h1>
                <p className="text-sm text-slate-500">
                  {getSubtypeLabel(chatInfo.community.subtype, chatInfo.community.department)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white to-[#043658]/[0.02] p-8">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#043658] to-[#043658]/80 shadow-lg mb-4">
                <svg
                  className="h-8 w-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#043658] mb-2">
                Real-time Chat Coming Soon!
              </h2>
              <p className="text-slate-600 mb-6">
                This is a level-based chat room for{" "}
                <span className="font-semibold text-[#043658]">
                  {getCommunityTypeLabel(chatInfo.community.type)}
                </span>{" "}
                community members.
              </p>
              <div className="bg-[#FFC107]/10 border border-[#FFC107]/30 rounded-xl p-4 text-left">
                <p className="text-sm font-semibold text-[#043658] mb-2">
                  📋 Chat Room Details:
                </p>
                <ul className="text-sm text-slate-700 space-y-1">
                  <li>• <span className="font-medium">Type:</span> {getCommunityTypeLabel(chatInfo.community.type)}</li>
                  <li>• <span className="font-medium">Category:</span> {getSubtypeLabel(chatInfo.community.subtype, chatInfo.community.department)}</li>
                  <li>• <span className="font-medium">Room ID:</span> {chatInfo.chatRoomId.substring(0, 8)}...</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Dashboard
              </Link>
              <button
                disabled
                className="px-6 py-2.5 bg-gradient-to-r from-[#043658] to-[#043658]/90 text-white rounded-xl font-semibold opacity-50 cursor-not-allowed"
              >
                Start Chatting (Soon)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
