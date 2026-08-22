"use client";

import { PenSquare } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";

interface CommunityHeaderProps {
  userName: string;
  profileImage?: string;
  level?: string;
  isVerified: boolean;
  onCreatePost: () => void;
}

export function CommunityHeader({ userName, profileImage, level, isVerified, onCreatePost }: CommunityHeaderProps) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">
            ServeLink Community
          </p>
          <h1 className="mt-1 font-['Lexend'] text-lg sm:text-xl font-semibold text-[#043658]">
            Connect, collaborate and share with educators.
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Avatar name={userName} profileImage={profileImage} size="sm" showRing={false} />
            <span className="text-sm font-semibold text-[#043658]">{userName}</span>
            {level && (
              <>
                <span className="text-slate-300">·</span>
                <span className="rounded-full bg-[#043658]/8 px-2.5 py-0.5 text-xs font-semibold text-[#043658]">
                  {level.replace(/^LEVEL_/, "Level ").replace(/_/g, " ")}
                </span>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onCreatePost}
          className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
            isVerified
              ? "bg-[#043658] text-white hover:bg-[#032742]"
              : "bg-slate-100 text-slate-500 cursor-not-allowed"
          }`}
        >
          <PenSquare className="h-4 w-4" />
          {isVerified ? "Create Post" : "Verification Required"}
        </button>
      </div>
    </div>
  );
}
