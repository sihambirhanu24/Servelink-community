"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useProfile } from "@/hooks/useProfile";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useUploadProfilePhoto } from "@/hooks/useUploadProfilePhoto";
import { Avatar } from "@/components/common/Avatar";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { ProfileStrengthCard } from "@/components/profile/ProfileStrengthCard";
import { ProgressToLevelCard } from "@/components/profile/ProgressToLevelCard";
import { CommunityAccessListCard } from "@/components/profile/CommunityAccessListCard";
import { RecentPostsCard } from "@/components/profile/RecentPostsCard";
import { StatsGrid } from "@/components/profile/StatsGrid";
import {
  BadgeCheck,
  Camera,
  Pencil,
  Shield,
  X,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

async function getDashboard() {
  const { data } = await api.get("/dashboard");
  return data;
}

/* ─── Editable field names ─────────────────────────────────────────────── */
interface EditForm {
  firstName: string;
  lastName: string;
  subject: string;
  school: string;
  woreda: string;
  zone: string;
  region: string;
}

function EditableProfileHeader({
  profile,
  onCancel,
}: {
  profile: any;
  onCancel: () => void;
}) {
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const [form, setForm] = useState<EditForm>({
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    subject: profile.subject ?? "",
    school: profile.school ?? "",
    woreda: profile.woreda ?? "",
    zone: profile.zone ?? "",
    region: profile.region ?? "",
  });

  function handleChange(field: keyof EditForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    try {
      await updateProfile(form);
      toast.success("Profile updated successfully");
      onCancel(); // exit edit mode
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 p-3 text-sm text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658] bg-slate-50";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            First Name
          </label>
          <input
            id="edit-firstName"
            value={form.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Last Name
          </label>
          <input
            id="edit-lastName"
            value={form.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          Subject
        </label>
        <input
          id="edit-subject"
          value={form.subject}
          onChange={(e) => handleChange("subject", e.target.value)}
          placeholder="e.g. Mathematics"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          School
        </label>
        <input
          id="edit-school"
          value={form.school}
          onChange={(e) => handleChange("school", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Woreda
          </label>
          <input
            id="edit-woreda"
            value={form.woreda}
            onChange={(e) => handleChange("woreda", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Zone
          </label>
          <input
            id="edit-zone"
            value={form.zone}
            onChange={(e) => handleChange("zone", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-500">
          Region
        </label>
        <input
          id="edit-region"
          value={form.region}
          onChange={(e) => handleChange("region", e.target.value)}
          placeholder="e.g. Oromia"
          className={inputClass}
        />
      </div>

      {/* Read-only fields */}
      <div className="grid grid-cols-2 gap-4 opacity-60">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Email (read-only)
          </label>
          <input
            value={profile.email ?? ""}
            disabled
            className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500">
            Teacher Level (read-only)
          </label>
          <input
            value={(profile.level ?? "").replace(/_/g, " ")}
            disabled
            className="w-full rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-400 cursor-not-allowed"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          id="save-profile-btn"
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isPending ? "Saving…" : "Save Changes"}
        </button>
        <button
          id="cancel-edit-btn"
          onClick={onCancel}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-[#043658] hover:bg-slate-50 transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}


function ProfileAvatarSection({ profile }: { profile: any }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: uploadPhoto, isPending: isUploading } =
    useUploadProfilePhoto();

  const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
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
      toast.error("Failed to upload photo. Please try again.");
    }


    e.target.value = "";
  }

  return (
    <div className="relative inline-block">
      <Avatar
        name={name}
        profileImage={profile.profileImage}
        size="xl"
        className="ring-4 ring-[#FFC107]/30"
      />

      <button
        id="change-avatar-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        aria-label="Change profile photo"
        className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#043658] text-white shadow-md transition hover:bg-[#FFC107] hover:text-[#043658] disabled:opacity-60"
      >
        {isUploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Camera className="h-3.5 w-3.5" />
        )}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard,
    staleTime: 30_000,
  });

  if (profileLoading || dashboardLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-500 text-sm">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Loading profile…
      </div>
    );
  }

  if (!profile || !dashboard) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-red-600 text-sm">
        We could not load your profile. Please refresh.
      </div>
    );
  }

  const teacher = dashboard.teacher;
  const stats = dashboard.stats;
  const name = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:px-10">

          {/* <div className="mb-6 flex items-center justify-between">
            <span className="rounded-full bg-[#043658] px-3 py-1.5 text-xs font-semibold text-white">
              {(profile.level ?? teacher.level)?.replace(/_/g, " ")}
            </span>
          </div> */}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">

              {/* Profile Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-5">
                  {/* Avatar with camera */}
                  <ProfileAvatarSection profile={profile} />

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <EditableProfileHeader
                        profile={profile}
                        onCancel={() => setIsEditing(false)}
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5">
                          <h1 className="font-['Lexend'] font-semibold text-[#043658] text-xl">
                            {name}
                          </h1>
                          {profile.verified && (
                            <BadgeCheck className="h-5 w-5 text-[#FFC107] fill-[#043658]" />
                          )}
                        </div>

                        <p className="text-sm text-slate-500 mt-0.5">
                          {profile.school} · {profile.subject ?? "No Subject Assigned"}
                        </p>

                        <div className="mt-2 text-xs text-slate-400 space-y-0.5">
                          {profile.region && (
                            <p>
                              <span className="font-medium text-slate-500">Region:</span> {profile.region}
                              {profile.zone ? ` · ${profile.zone}` : ""}
                              {profile.woreda ? ` · ${profile.woreda}` : ""}
                            </p>
                          )}
                          <p>
                            <span className="font-medium text-slate-500">Email:</span> {profile.email}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                          <button
                            id="edit-profile-btn"
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-4 py-2 text-xs font-medium text-white hover:bg-[#043658]/90 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit Profile
                          </button>

                          <Link href="/profile/change-password">
                            <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-[#043658] hover:bg-slate-50 transition-colors">
                              <Shield className="h-3.5 w-3.5" />
                              Change Password
                            </button>
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <StatsGrid
                posts={stats?.posts ?? 0}
                likes={stats?.likes ?? 0}
                resources={stats?.resources ?? 0}
              />

              <RecentPostsCard />
            </div>

            {/* Right column */}
            <div className="space-y-6">
              <ProfileStrengthCard profile={profile} />
              
              <ProgressToLevelCard
                currentLevel={teacher.level}
                stats={{
                  posts: stats?.posts ?? 0,
                  likes: stats?.likes ?? 0,
                  communities: stats?.communities ?? 0,
                }}
              />
              
              <CommunityAccessListCard communityAccess={dashboard.communityAccess} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}