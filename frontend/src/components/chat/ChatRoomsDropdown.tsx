"use client";

import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Menu, Transition } from "@headlessui/react";
import { MessageSquare, Users, Loader2, ChevronRight } from "lucide-react";
import api from "@/lib/axios";

interface ChatGroup {
  id: string;
  name: string;
  type: string;
  subtype: string;
  department: string | null;
  school: string | null;
  woreda: string | null;
  zone: string | null;
  region: string | null;
  chatRoomId: string | null;
  memberCount: number;
  unreadCount: number;
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
}

interface ChatGroupsResponse {
  groups: ChatGroup[];
}

async function getChatGroups(): Promise<ChatGroup[]> {
  const { data } = await api.get<ChatGroupsResponse>("/chat/groups");
  return data.groups;
}

export function ChatRoomsDropdown() {
  const router = useRouter();
  
  const { data: chatGroups = [], isLoading } = useQuery({
    queryKey: ["chat-groups"],
    queryFn: async () => {
      const groups = await getChatGroups();
      console.log("📢 Chat Groups from API:", groups);
      groups.forEach((g, i) => {
        console.log(`  [${i}] type=${g.type}, subtype=${g.subtype}, dept=${g.department}, name=${g.name}`);
      });
      return groups;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const totalUnread = chatGroups.reduce((sum, group) => sum + group.unreadCount, 0);

  const handleRoomClick = (group: ChatGroup) => {
    // Navigate to the appropriate chat route based on community type and subtype
    const typeMap: Record<string, string> = {
      SCHOOL: "school",
      WOREDA: "woreda",
      ZONE: "zone",
      REGION: "region",
      NATIONAL: "national",
    };
    
    const typePath = typeMap[group.type] || group.type.toLowerCase();
    
    // COMMON chat: /community/type/{type}/chat
    // DEPARTMENT chat: /community/type/{type}/chat/{department}
    if (group.subtype === "DEPARTMENT" && group.department) {
      router.push(`/community/type/${typePath}/chat/${encodeURIComponent(group.department)}`);
    } else {
      router.push(`/community/type/${typePath}/chat`);
    }
  };

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

  const getRoomDisplayName = (group: ChatGroup) => {
    console.log(`🏷️ getRoomDisplayName: type=${group.type}, subtype=${group.subtype}, dept=${group.department}`);
    
    // LEVEL_1 (School): Just show "School Chat"
    if (group.type === "SCHOOL") {
      return "School Chat";
    }
    
    // DEPARTMENT chat: Show department name + "Teachers"
    if (group.subtype === "DEPARTMENT" && group.department) {
      const displayName = `${group.department} Teachers`;
      console.log(`  ✅ Returning department name: ${displayName}`);
      return displayName;
    }
    
    // COMMON chat: Show type + "Common"
    const typeLabel = getCommunityTypeLabel(group.type);
    const displayName = `${typeLabel} Common`;
    console.log(`  ✅ Returning common name: ${displayName}`);
    return displayName;
  };

  const getRoomDescription = (group: ChatGroup) => {
    if (group.type === "SCHOOL") {
      return "Your school community";
    }
    
    if (group.subtype === "DEPARTMENT" && group.department) {
      // Show: "Physics teachers in Zone 05" or "Mathematics teachers in Oromia Region"
      const typeLabel = getCommunityTypeLabel(group.type);
      const location = group.zone || group.woreda || group.region || group.school || typeLabel;
      return `${group.department} teachers in ${location}`;
    }
    
    // COMMON: "All teachers in Zone 05" or "All teachers in Oromia Region"
    const typeLabel = getCommunityTypeLabel(group.type);
    const location = group.zone || group.woreda || group.region || group.school || typeLabel;
    return `All teachers in ${location}`;
  };

  const formatLastMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button
        aria-label="Chat rooms"
        title="Chat Rooms"
        className="
          relative
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-white
          transition-all
          duration-200
          hover:bg-white/10
          focus:outline-none
          focus:ring-2
          focus:ring-[#FFC107]/40
        "
      >
        <MessageSquare className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        
        {/* Unread badge */}
        {totalUnread > 0 && (
          <span
            className="
              absolute
              -top-1
              -right-1
              flex
              h-5
              min-w-[20px]
              items-center
              justify-center
              rounded-full
              bg-[#FFC107]
              px-1.5
              text-[10px]
              font-bold
              text-[#043658]
              shadow-lg
              ring-2
              ring-slate-800
            "
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className="
            absolute
            right-0
            z-50
            mt-2
            w-80
            origin-top-right
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-xl
            focus:outline-none
          "
        >
          {/* Header */}
          <div className="border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-[#043658]">Chat Rooms</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Available communities based on your level
            </p>
          </div>

          {/* Chat Groups List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#043658]" />
              </div>
            ) : chatGroups.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">No chat rooms available</p>
                <p className="text-xs text-slate-400 mt-1">
                  Chat rooms are created based on your level
                </p>
              </div>
            ) : (
              <div className="py-1">
                {/* Info banner for Level 2-5 with 2 rooms */}
                {chatGroups.length === 2 && chatGroups[0].type !== "SCHOOL" && (
                  <div className="px-4 py-2 bg-[#FFC107]/10 border-b border-[#FFC107]/20">
                    <p className="text-xs text-[#043658] font-medium">
                      💬 Two chat rooms available:
                    </p>
                    <ul className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                      <li>• <span className="font-semibold">Subject Chat:</span> Your department colleagues only</li>
                      <li>• <span className="font-semibold">Common Chat:</span> All teachers at your level</li>
                    </ul>
                  </div>
                )}
                
                {chatGroups.map((group, index) => (
                  <Menu.Item key={group.id}>
                    {({ active }) => (
                      <button
                        onClick={() => handleRoomClick(group)}
                        className={`
                          flex
                          w-full
                          items-start
                          gap-3
                          px-4
                          py-3
                          text-left
                          transition-colors
                          focus:outline-none
                          ${index > 0 ? "border-t border-slate-100" : ""}
                          ${
                            active
                              ? "bg-[#043658]/5"
                              : group.unreadCount > 0
                              ? "bg-[#FFC107]/5"
                              : ""
                          }
                        `}
                      >
                        {/* Icon */}
                        <div
                          className={`
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            ${
                              group.subtype === "DEPARTMENT"
                                ? "bg-gradient-to-br from-[#FFC107] to-amber-400 shadow-md"
                                : group.type === "SCHOOL"
                                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md"
                                : "bg-gradient-to-br from-[#043658] to-[#043658]/80 shadow-md"
                            }
                          `}
                        >
                          <Users className="h-5 w-5 text-white" />
                          {/* Badge for type */}
                          {group.subtype === "DEPARTMENT" && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#FFC107] shadow-sm">
                              D
                            </span>
                          )}
                          {group.subtype === "COMMON" && group.type !== "SCHOOL" && (
                            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#043658] shadow-sm">
                              C
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Title */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="flex-1 min-w-0">
                              <p
                                className={`
                                  text-sm
                                  truncate
                                  leading-tight
                                  ${
                                    group.unreadCount > 0
                                      ? "font-bold text-[#043658]"
                                      : "font-semibold text-slate-700"
                                  }
                                `}
                              >
                                {getRoomDisplayName(group)}
                              </p>
                              <p className="text-xs text-slate-500 truncate mt-0.5">
                                {getRoomDescription(group)}
                              </p>
                            </div>

                            {/* Unread badge */}
                            {group.unreadCount > 0 && (
                              <span
                                className="
                                  flex
                                  h-5
                                  min-w-[20px]
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-[#FFC107]
                                  px-1.5
                                  text-[10px]
                                  font-bold
                                  text-[#043658]
                                  shadow-sm
                                "
                              >
                                {group.unreadCount > 99 ? "99+" : group.unreadCount}
                              </span>
                            )}
                          </div>

                          {/* Last message preview */}
                          {group.lastMessage && (
                            <div className="flex items-center justify-between gap-2 mt-1.5">
                              <p
                                className={`
                                  text-xs
                                  truncate
                                  flex-1
                                  ${
                                    group.unreadCount > 0
                                      ? "text-slate-600 font-medium"
                                      : "text-slate-400"
                                  }
                                `}
                              >
                                <span className="font-semibold text-[#043658]">
                                  {group.lastMessage.senderName.split(" ")[0]}:
                                </span>{" "}
                                {group.lastMessage.content}
                              </p>
                              <span className="text-[10px] text-slate-400 shrink-0">
                                {formatLastMessageTime(group.lastMessage.createdAt)}
                              </span>
                            </div>
                          )}

                          {/* Member count */}
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[10px] text-slate-400">
                              👥 {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}
                            </p>
                            {group.subtype === "DEPARTMENT" && group.department && (
                              <span className="text-[10px] text-[#FFC107] font-semibold">
                                🎯 {group.department} Only
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Arrow indicator */}
                        <ChevronRight
                          className={`
                            h-4
                            w-4
                            shrink-0
                            self-center
                            transition-transform
                            ${active ? "translate-x-1 text-[#043658]" : "text-slate-300"}
                          `}
                        />
                      </button>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {chatGroups.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50">
              <div className="text-center">
                <p className="text-[10px] text-slate-500">
                  {chatGroups.length === 1 ? (
                    <span>
                      <span className="font-semibold text-[#043658]">School Level:</span> One common chat room
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold text-[#043658]">Level {chatGroups[0]?.type}:</span> Department + Common chats
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
