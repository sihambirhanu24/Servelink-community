"use client";

import { BadgeCheck } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { useRouter } from "next/navigation";

interface Teacher {
  id?: string;
  firstName: string;
  lastName: string;
  level?: string;
  verified?: boolean;
  profileImage?: string;
  profession?: string;
}

interface Community {
  name?: string;
}

interface PostAuthorProps {
  teacher: Teacher;
  community?: Community;
  createdAt?: string;
  showMenu?: boolean;
  onMenuClick?: () => void;
  isOwner?: boolean;
}

export function PostAuthor({ teacher, community, createdAt, showMenu, onMenuClick, isOwner }: PostAuthorProps) {
  const router = useRouter();
  const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Teacher";
  const teacherInitial = teacher?.firstName?.charAt(0) ?? "T";
  const teacherProfileImage = teacher?.profileImage;
  const teacherLevel = teacher?.level ?? "Teacher";
  const isTeacherVerified = teacher?.verified ?? false;
  const teacherId = teacher?.id;

  const handleAuthorClick = () => {
    if (teacherId) {
      router.push(`/profile/${teacherId}`);
    }
  };

  const formatRelativeTime = (value?: string) => {
    if (!value) return "Just now";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Recently shared";
    const now = Date.now();
    const diffInMs = now - parsed.getTime();
    const minutes = Math.max(1, Math.round(diffInMs / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  };

  return (
    <div className="flex w-full items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={handleAuthorClick}
          className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100 transition hover:ring-2 hover:ring-[#043658] hover:ring-offset-2"
          disabled={!teacherId}
          aria-label={`View ${teacherName}'s profile`}
        >
          {teacherProfileImage ? (
            <img 
              src={getMediaUrl(teacherProfileImage)} 
              alt={teacherName} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#043658] text-sm font-semibold text-white">
              {teacherInitial}
            </div>
          )}
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleAuthorClick}
              className="truncate text-sm font-semibold text-[#043658] transition hover:text-[#032742] hover:underline"
              disabled={!teacherId}
            >
              {teacherName}
            </button>
            {isTeacherVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-[#FFC107]" />}
          </div>
          <p className="truncate text-xs text-slate-500">
            {teacherLevel.replace(/^LEVEL_/, "Level ").replace(/_/g, " ")}
            {teacher?.profession ? ` · ${teacher.profession}` : ""}
            {community?.name ? ` · ${community.name}` : ""}
            {` · ${formatRelativeTime(createdAt)}`}
          </p>
        </div>
      </div>

      {showMenu && (
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#043658]"
          aria-label="More options"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      )}
    </div>
  );
}
