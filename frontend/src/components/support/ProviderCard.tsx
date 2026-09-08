"use client";

import { Star, MessageCircle, Video, FileText, Users } from "lucide-react";
import Image from "next/image";
import type { SupportProviderProfile, SupportType } from "@/services/support";

interface ProviderCardProps {
  provider: SupportProviderProfile;
  onRequestSupport: (providerId: string) => void;
}

const SUPPORT_TYPE_ICONS: Record<SupportType, React.ReactNode> = {
  CHAT: <MessageCircle className="h-3.5 w-3.5" />,
  LIVE_SESSION: <Video className="h-3.5 w-3.5" />,
  RESOURCE: <FileText className="h-3.5 w-3.5" />,
  MENTORSHIP: <Users className="h-3.5 w-3.5" />,
};

export function ProviderCard({ provider, onRequestSupport }: ProviderCardProps) {
  const { teacher } = provider;
  const fullName = `${teacher.firstName} ${teacher.lastName}`;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          {teacher.profileImage ? (
            <Image
              src={teacher.profileImage}
              alt={fullName}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#043658] flex items-center justify-center text-white font-bold text-lg">
              {teacher.firstName[0]}
              {teacher.lastName[0]}
            </div>
          )}
          {teacher.verified && (
            <div className="absolute -bottom-1 -right-1 bg-[#FFC107] rounded-full p-1">
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-slate-900 truncate">{fullName}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-2 py-0.5 bg-[#043658]/10 text-[#043658] rounded-full font-medium">
              {teacher.level.replace("_", " ")}
            </span>
            {provider.averageRating && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span className="text-xs font-semibold text-slate-700">
                  {provider.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {!provider.isAvailable && (
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-lg font-medium">
            Unavailable
          </span>
        )}
      </div>

      {/* Experience */}
      <p className="text-xs text-slate-600 mb-3 line-clamp-1">
        {provider.experience}
      </p>

      {/* Description */}
      <p className="text-sm text-slate-700 mb-4 line-clamp-2">
        {provider.description}
      </p>

      {/* Expertise Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {provider.expertise.slice(0, 5).map((skill) => (
          <span
            key={skill}
            className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-md font-medium"
          >
            {skill}
          </span>
        ))}
        {provider.expertise.length > 5 && (
          <span className="text-xs px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
            +{provider.expertise.length - 5} more
          </span>
        )}
      </div>

      {/* Support Types */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
        {provider.supportTypes.map((type) => (
          <div
            key={type}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-[#043658]/5 text-[#043658] rounded-lg"
            title={type.replace("_", " ")}
          >
            {SUPPORT_TYPE_ICONS[type]}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {provider.completedSessions} completed session
          {provider.completedSessions !== 1 ? "s" : ""}
        </div>

        <button
          onClick={() => onRequestSupport(provider.teacherId)}
          disabled={!provider.isAvailable}
          className="px-4 py-2 bg-[#043658] text-white text-sm font-semibold rounded-lg hover:bg-[#043658]/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
        >
          Request Support
        </button>
      </div>
    </div>
  );
}
