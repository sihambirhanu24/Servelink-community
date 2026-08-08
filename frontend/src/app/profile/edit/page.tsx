"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import BackButton from "@/components/common/BackButton";
import { Loader2 } from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [school, setSchool] = useState("");
  const [region, setRegion] = useState("");
  const [woreda, setWoreda] = useState("");
  const [zone, setZone] = useState("");
  const [subject, setSubject] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setSchool(profile.school || "");
      setRegion(profile.region || "");
      setWoreda(profile.woreda || "");
      setZone(profile.zone || "");
      setSubject(profile.subject || "");
    }
  }, [profile]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      await updateProfile({
        firstName,
        lastName,
        school,
        region,
        woreda,
        zone,
        subject,
      });

      toast.success("Profile updated successfully");
      router.push("/profile");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#043658]" />
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 p-3 text-sm text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]";

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center py-10 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm border border-slate-200"
      >
        <BackButton />

        <h1 className="mb-8 mt-4 font-['Lexend'] text-2xl font-semibold text-[#043658]">
          Edit Profile
        </h1>

        {/* First & Last Name */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              First Name
            </label>
            <input
              id="edit-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Enter first name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Last Name
            </label>
            <input
              id="edit-lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter last name"
              className={inputClass}
            />
          </div>
        </div>

        {/* School */}
        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            School
          </label>
          <input
            id="edit-school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="Adama Science and Technology University"
            className={inputClass}
          />
        </div>

        {/* Subject */}
        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Subject
          </label>
          <input
            id="edit-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Mathematics"
            className={inputClass}
          />
        </div>

        {/* Region */}
        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-slate-600">
            Region
          </label>
          <input
            id="edit-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="Oromia"
            className={inputClass}
          />
        </div>

        {/* Woreda & Zone */}
        <div className="mt-5 grid grid-cols-2 gap-6">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Woreda
            </label>
            <input
              id="edit-woreda"
              value={woreda}
              onChange={(e) => setWoreda(e.target.value)}
              placeholder="Adama Woreda"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600">
              Zone
            </label>
            <input
              id="edit-zone"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              placeholder="East Shewa"
              className={inputClass}
            />
          </div>
        </div>

        <button
          id="edit-profile-submit"
          type="submit"
          disabled={isPending}
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-[#043658] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#043658]/90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>
    </main>
  );
}
