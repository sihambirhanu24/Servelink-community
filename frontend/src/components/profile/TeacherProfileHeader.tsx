"use client";

import { BadgeCheck, MapPin, Mail, MessageSquare } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import type { TeacherProfile } from "@/services/teachers";

interface TeacherProfileHeaderProps {
  profile: TeacherProfile;
  onFollow: () => void;
  onUnfollow: () => void;
  isFollowing: boolean;
  isCurrentUser?: boolean;
}

export function TeacherProfileHeader({ 
  profile, 
  onFollow, 
  onUnfollow, 
  isFollowing,
  isCurrentUser = false 
}: TeacherProfileHeaderProps) {
  const fullName = `${profile.firstName} ${profile.lastName}`;
  const initials = `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`.toUpperCase();
  const levelLabel = profile.level.replace(/^LEVEL_/, "Level ").replace(/_/g, " ");

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-br from-[#043658] to-[#064a7a] sm:h-40">
        {profile.bannerUrl && (
          <img
            src={getMediaUrl(profile.bannerUrl)}
            alt={`${fullName}'s banner`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Content */}
      <div className="px-6 py-5 sm:px-8 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Avatar */}
          <div className="relative -mt-16 sm:-mt-20 shrink-0">
            <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg sm:h-32 sm:w-32">
              {profile.profileImage ? (
                <img
                  src={getMediaUrl(profile.profileImage)}
                  alt={fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#043658] text-2xl font-bold text-white sm:text-3xl">
                  {initials}
                </div>
              )}
            </div>
            {profile.isVerified && (
              <div className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md sm:h-8 sm:w-8">
                <BadgeCheck className="h-4 w-4 text-[#FFC107] sm:h-5 sm:w-5" />
              </div>
            )}
          </div>

          {/* Name and basic info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-[#043658] sm:text-2xl">
              {fullName}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
              <span className="font-medium">{levelLabel}</span>
              {profile.profession && <span>· {profile.profession}</span>}
              {profile.department && <span>· {profile.department}</span>}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {profile.school}
              </span>
              {profile.region && <span>· {profile.region}</span>}
              {profile.woreda && <span>· {profile.woreda}</span>}
            </div>
            
            {/* Bio */}
            {profile.bio && (
              <p className="mt-3 text-sm text-slate-600 leading-relaxed line-clamp-2">
                {profile.bio}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:items-end sm:shrink-0">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-lg font-bold text-[#043658]">{profile.followerCount}</p>
                <p className="text-xs text-slate-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#043658]">{profile.followingCount}</p>
                <p className="text-xs text-slate-500">Following</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-[#043658]">{profile.postsCount}</p>
                <p className="text-xs text-slate-500">Posts</p>
              </div>
            </div>
            {!isCurrentUser && (
              <div className="flex items-center gap-2">
                <button
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#043658] transition hover:bg-slate-50"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Message</span>
                </button>
                <button
                  onClick={isFollowing ? onUnfollow : onFollow}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    isFollowing
                      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      : "bg-[#043658] text-white hover:bg-[#032742]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
