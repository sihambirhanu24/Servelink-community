"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Camera, CheckCircle2, MapPin,
  FileText, Heart, Users, BookOpen, Edit3, AlertTriangle,
} from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useUploadProfilePhoto } from "@/hooks/useUploadProfilePhoto";
import { useQuery } from "@tanstack/react-query";
import { getMyPosts } from "@/services/profile";
import { toast } from "sonner";
import { useSuspensionStatus } from "@/hooks/useSuspensionStatus";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function levelLabel(raw?: string) {
  return String(raw ?? "LEVEL_1")
    .replace(/^LEVEL_/, "Level ")
    .replace(/_/g, " ");
}

// Calculate profile completeness from real fields.
// Returns { pct, nextStep }.
function calcCompleteness(profile: any) {
  const checks = [
    { key: "profileImage",     label: "Profile photo"    },
    { key: "firstName",        label: "First name"       },
    { key: "lastName",         label: "Last name"        },
    { key: "bio",              label: "Bio"              },
    { key: "phone",            label: "Phone number"     },
    { key: "profession",       label: "Profession"       },
    { key: "department",       label: "Department"       },
    { key: "subject",          label: "Subject"          },
    { key: "skills",           label: "Skills"           },
    { key: "gradeLevel",       label: "Grade level"      },
    { key: "yearsOfExperience",label: "Years of experience" },
    { key: "school",           label: "School"           },
  ];
  const done  = checks.filter((c) => profile?.[c.key] && String(profile[c.key]).trim() !== "");
  const pct   = Math.round((done.length / checks.length) * 100);
  const next  = checks.find((c) => !profile?.[c.key] || String(profile[c.key]).trim() === "");
  return { pct, nextStep: next?.label ?? null };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileHeaderCardProps {
  profile: any;
  name: string;
  stats?: { posts?: number; likes?: number; resources?: number };
  followersCount?: number;
  followingCount?: number;
  pendingLocationRequest?: boolean;
  onRequestLocationChange?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHeaderCard({
  profile,
  name,
  stats,
  followersCount = 0,
  followingCount = 0,
  pendingLocationRequest,
  onRequestLocationChange,
}: ProfileHeaderCardProps) {
  const router    = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadPhoto, isPending: isUploading } =
    useUploadProfilePhoto();
  const { suspensionStatus } = useSuspensionStatus(profile?.id);

  // Real post stats — falls back to stats prop while query resolves
  const { data: myPosts = [] } = useQuery({
    queryKey: ["my-posts"],
    queryFn:  getMyPosts,
  });
  const postCount = (myPosts as any[]).length || stats?.posts || 0;
  const totalLikes = (myPosts as any[]).reduce(
    (sum: number, p: any) => sum + (p.communityLikes?.length ?? p.likesCount ?? 0),
    0,
  ) || stats?.likes || 0;
  const resourceCount = (myPosts as any[]).filter(
    (p: any) => p.attachments?.length > 0,
  ).length || stats?.resources || 0;

  const { pct, nextStep } = calcCompleteness(profile);

  const verStatus = profile?.verificationStatus;
  const isVerified = verStatus === "APPROVED";
  const isPending  = verStatus === "PENDING";
  const isRejected = verStatus === "REJECTED";

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg","image/jpg","image/png","image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      return;
    }
    try {
      await uploadPhoto(file);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo.");
    }
    e.target.value = "";
  }

  const level = levelLabel(profile?.level);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* ── Banner ─────────────────────────────────────────────────── */}
      <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#043658] to-[#064a7a] overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Edit button */}
        <button
          onClick={() => router.push("/profile/edit")}
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit Profile
        </button>
      </div>

      {/* ── Main content ────────────────────────────────────────────── */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Avatar row */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 -mt-12">
          {/* Avatar + camera */}
          <div className="relative shrink-0">
            <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white shadow-lg overflow-hidden">
              <Avatar
                name={name}
                profileImage={profile?.profileImage}
                size="xl"
                className="h-full w-full"
              />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={isUploading}
              aria-label="Change profile photo"
              className="
                absolute -bottom-1 -right-1
                flex h-8 w-8 items-center justify-center
                rounded-full bg-[#043658] text-white shadow-md
                hover:bg-[#FFC107] hover:text-[#043658]
                disabled:opacity-60 transition-colors
              "
            >
              <Camera className={`h-4 w-4 ${isUploading ? "animate-pulse" : ""}`} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0 pt-14 sm:pt-16">
            {/* Name + level + verified + suspension */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-['Lexend'] text-xl font-bold text-[#043658] sm:text-2xl truncate">
                {name}
              </h1>
              <span className="shrink-0 rounded-full bg-[#043658] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FFC107]">
                {level}
              </span>
              {suspensionStatus?.isSuspended ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Suspended
                </span>
              ) : isVerified && (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
              {isPending && !suspensionStatus?.isSuspended && (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Shield className="h-3.5 w-3.5" />
                  Pending
                </span>
              )}
              {isRejected && !suspensionStatus?.isSuspended && (
                <span className="flex shrink-0 items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">
                  <Shield className="h-3.5 w-3.5" />
                  Rejected
                </span>
              )}
            </div>

            {/* Profession + subject */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
              <span className="font-medium">{profile?.profession ?? "Teacher"}</span>
              {profile?.department && <span>· {profile.department}</span>}
              {profile?.subject && <span>· {profile.subject}</span>}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed line-clamp-2">
                {profile.bio}
              </p>
            )}

            {/* Location */}
            {profile?.region && (
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  {profile.school}
                </span>
                {profile.region && <span>· {profile.region}</span>}
                {profile.woreda && <span>· {profile.woreda}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Stats row ──────────────────────────────────────────────── */}
        <div className="mt-5 grid grid-cols-4 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50">
          {[
            { icon: <FileText className="h-4 w-4" />, value: postCount,      label: "Posts",     href: "/profile/posts" },
            { icon: <Heart     className="h-4 w-4" />, value: totalLikes,    label: "Likes",     href: undefined },
            { icon: <BookOpen  className="h-4 w-4" />, value: resourceCount, label: "Resources", href: undefined },
            { icon: <Users     className="h-4 w-4" />, value: followersCount,label: "Followers", href: undefined },
          ].map((s) => (
            <div
              key={s.label}
              onClick={() => s.href && router.push(s.href)}
              role={s.href ? "link" : undefined}
              className={`flex flex-col items-center py-3 px-2 ${s.href ? "cursor-pointer hover:bg-slate-100 transition-colors rounded-none" : ""}`}
            >
              <span className="text-slate-400 mb-0.5">{s.icon}</span>
              <span className="text-lg font-bold text-[#043658]">{s.value}</span>
              <span className="text-[10px] font-medium text-slate-500">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Profile completeness ──────────────────────────────────── */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Profile Completeness</span>
            <span className="text-xs font-bold text-[#043658]">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#043658] to-[#FFC107] transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {nextStep && pct < 100 && (
            <button
              onClick={() => router.push("/verification-setup")}
              className="mt-2 text-xs text-[#043658] font-medium hover:underline"
            >
              Next: Add {nextStep} →
            </button>
          )}
          {pct === 100 && (
            <p className="mt-2 text-xs font-semibold text-green-600">
              ✓ Profile complete
            </p>
          )}
        </div>

        {/* ── Action buttons ────────────────────────────────────────── */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {onRequestLocationChange && (
            pendingLocationRequest ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                <MapPin className="h-3.5 w-3.5" />
                Location Change Pending
              </span>
            ) : (
              <button
                onClick={onRequestLocationChange}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-[#043658] hover:bg-slate-50 hover:border-[#043658]/30 transition-colors"
              >
                <MapPin className="h-3.5 w-3.5" />
                Request Location Change
              </button>
            )
          )}

          {!isVerified && (
            <button
              onClick={() => router.push("/verification-setup")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                isRejected
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : isPending
                  ? "border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  : "bg-[#FFC107] text-[#043658] hover:bg-yellow-400"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              {isRejected ? "Update Verification" : isPending ? "View Verification Status" : "Complete Verification"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
