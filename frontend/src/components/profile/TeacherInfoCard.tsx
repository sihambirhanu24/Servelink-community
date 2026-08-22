"use client";

import { Mail, MapPin, BookOpen, GraduationCap, Star, Briefcase, Award } from "lucide-react";

interface TeacherInfoCardProps {
  profile: any;
}

export function TeacherInfoCard({ profile }: TeacherInfoCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#043658]/5 to-transparent px-5 py-3">
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
          Teacher Information
        </h3>
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Profession */}
          {(profile as any)?.profession && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                <Briefcase className="h-4 w-4 text-[#043658]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Profession
                </p>
                <p className="text-sm font-medium text-slate-700 capitalize">
                  {(profile as any).profession}
                </p>
              </div>
            </div>
          )}

          {/* Experience */}
          {(profile as any)?.yearsOfExperience != null && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                <Award className="h-4 w-4 text-[#043658]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Experience
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {(profile as any).yearsOfExperience} years
                </p>
              </div>
            </div>
          )}

          {/* Department */}
          {profile?.department && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                <BookOpen className="h-4 w-4 text-[#043658]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Department
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {profile.department}
                </p>
              </div>
            </div>
          )}

          {/* Grade Level */}
          {(profile as any)?.gradeLevel && (
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                <GraduationCap className="h-4 w-4 text-[#043658]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Grade Level
                </p>
                <p className="text-sm font-medium text-slate-700">
                  {(profile as any).gradeLevel}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Specialization */}
        {(profile as any)?.specialization && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
              <Star className="h-4 w-4 text-[#043658]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Specialization
              </p>
              <p className="text-sm font-medium text-slate-700">
                {(profile as any).specialization}
              </p>
            </div>
          </div>
        )}

        {/* Skills */}
        {(profile as any)?.skills && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
              <Star className="h-4 w-4 text-[#043658]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Skills
              </p>
              <p className="text-sm font-medium text-slate-700 break-words">
                {(profile as any).skills}
              </p>
            </div>
          </div>
        )}

        {/* School */}
        {profile?.school && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
              <BookOpen className="h-4 w-4 text-[#043658]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                School
              </p>
              <p className="text-sm font-medium text-slate-700">
                {profile.school}
              </p>
            </div>
          </div>
        )}

        {/* Location */}
        {profile?.region && (
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
              <MapPin className="h-4 w-4 text-[#043658]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                Location
              </p>
              <p className="text-sm font-medium text-slate-700">
                {profile.region}
                {profile.zone ? `, ${profile.zone}` : ""}
                {profile.woreda ? `, ${profile.woreda}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
            <Mail className="h-4 w-4 text-[#043658]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Email
            </p>
            <p className="text-sm font-medium text-slate-700 break-all">
              {profile?.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
