"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Shield, Camera, CheckCircle2, Edit3, MapPin } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { useUploadProfilePhoto } from "@/hooks/useUploadProfilePhoto";
import { toast } from "sonner";

interface ProfileHeaderCardProps {
  profile: any;
  name: string;
  pendingLocationRequest?: boolean;
  onRequestLocationChange?: () => void;
}

export function ProfileHeaderCard({ profile, name, pendingLocationRequest, onRequestLocationChange }: ProfileHeaderCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadPhoto, isPending: isUploading } =
    useUploadProfilePhoto();

  async function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Only jpg, jpeg, png, webp images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
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

  const levelLabel = String(profile?.level ?? "LEVEL_1")
    .replace(/^LEVEL_/, "Level ")
    .replace(/_/g, " ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Banner */}
      <div className="h-24 bg-gradient-to-r from-[#043658] to-[#064a7a] relative">
        <button
          onClick={() => router.push("/profile/edit")}
          className="absolute top-4 right-4 flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5" />
          Edit Profile
        </button>
      </div>

      <div className="px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 -mt-10">
          {/* Avatar */}
          <div className="relative inline-block shrink-0">
            <Avatar
              name={name}
              profileImage={profile?.profileImage}
              size="xl"
              className="ring-4 ring-white shadow-lg"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#043658] text-white shadow-md transition hover:bg-[#FFC107] hover:text-[#043658] disabled:opacity-60"
            >
              {isUploading ? (
                <Camera className="h-3.5 w-3.5 animate-pulse" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2 sm:pt-12">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-['Lexend'] font-semibold text-[#043658] text-xl sm:text-2xl truncate">
                {name}
              </h1>
              <span className="shrink-0 rounded-full bg-[#043658] px-3 py-1 text-[10px] font-bold tracking-wide text-[#FFC107]">
                {levelLabel.toUpperCase()}
              </span>
              {profile?.verificationStatus === "APPROVED" && (
                <span className="flex items-center gap-1 rounded-full bg-green-50 border border-green-200 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>

            <p className="mt-1.5 text-sm text-slate-600 truncate">
              {profile?.profession ?? "Teacher"}
              {profile?.subject ? ` · ${profile.subject}` : ""}
              {profile?.school ? ` · ${profile.school}` : ""}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {profile?.region && (
                <span className="flex items-center gap-1">
                  <span className="truncate">
                    {profile.region}
                    {profile.zone ? `, ${profile.zone}` : ""}
                    {profile.woreda ? `, ${profile.woreda}` : ""}
                  </span>
                </span>
              )}
              <span className="truncate">{profile?.email}</span>
            </div>

            {/* Location change request button */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {onRequestLocationChange && (
                pendingLocationRequest ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700">
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

              {profile?.verificationStatus !== "APPROVED" && (
                <button
                  onClick={() => router.push("/verification-setup")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFC107] px-4 py-1.5 text-xs font-semibold text-[#043658] hover:bg-yellow-400 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Complete Verification
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
