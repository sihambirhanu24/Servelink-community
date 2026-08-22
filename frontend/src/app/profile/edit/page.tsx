"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useUpdateProfile } from "@/hooks/useUpdateProfile";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  User,
  Briefcase,
  School,
  CheckCircle2,
  Camera,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useUploadProfilePhoto } from "@/hooks/useUploadProfilePhoto";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROFESSIONS = ["Teacher", "Lecturer", "Instructor", "Tutor", "Other"];
const GRADE_LEVELS = [
  "Kindergarten",
  "Primary (1-4)",
  "Primary (5-8)",
  "Secondary (9-10)",
  "Secondary (11-12)",
  "Higher Education",
  "Other",
];
const SCHOOL_TYPES = [
  "Government",
  "Private",
  "Missionary",
  "Community",
  "Other",
];

const STEPS = [
  { key: "personal",      label: "Personal",    icon: User },
  { key: "professional",  label: "Professional", icon: Briefcase },
  { key: "school",        label: "School",       icon: School },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

// ─── Field input ──────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-[#043658] placeholder:text-slate-400 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20 transition-all";
const disabledCls =
  "w-full rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-sm text-slate-400 cursor-not-allowed";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<StepKey>("personal");

  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } =
    useUploadProfilePhoto();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Personal
    firstName: "",
    lastName: "",
    gender: "",
    phone: "",
    bio: "",
    // Professional
    profession: "",
    specialization: "",
    skills: "",
    gradeLevel: "",
    yearsOfExperience: "",
    // School
    schoolType: "",
    city: "",
    schoolLocation: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      firstName:        profile.firstName        ?? "",
      lastName:         profile.lastName         ?? "",
      gender:           (profile as any).gender  ?? "",
      phone:            (profile as any).phone   ?? "",
      bio:              (profile as any).bio     ?? "",
      profession:       (profile as any).profession   ?? "",
      specialization:   (profile as any).specialization ?? "",
      skills:           (profile as any).skills        ?? "",
      gradeLevel:       (profile as any).gradeLevel    ?? "",
      yearsOfExperience:
        (profile as any).yearsOfExperience != null
          ? String((profile as any).yearsOfExperience)
          : "",
      schoolType:     (profile as any).schoolType     ?? "",
      city:           (profile as any).city           ?? "",
      schoolLocation: (profile as any).schoolLocation ?? "",
    });
  }, [profile]);

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ── Completion ──────────────────────────────────────────────────────────────
  const sections = {
    personal:     !!(form.firstName && form.lastName && form.bio && form.phone),
    professional: !!(form.profession && form.specialization && form.skills && form.gradeLevel),
    school:       !!(profile?.school && form.schoolType && form.city && form.schoolLocation),
  };
  const doneCount  = Object.values(sections).filter(Boolean).length;
  const pct        = Math.round((doneCount / 3) * 100);
  const allDone    = doneCount === 3;

  const name = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : "";

  // ── Photo upload ─────────────────────────────────────────────────────────
  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
    try {
      await uploadPhoto(file);
      toast.success("Photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    }
    e.target.value = "";
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile({
        firstName:        form.firstName       || undefined,
        lastName:         form.lastName        || undefined,
        gender:           form.gender          || undefined,
        phone:            form.phone           || undefined,
        bio:              form.bio             || undefined,
        profession:       form.profession      || undefined,
        specialization:   form.specialization  || undefined,
        skills:           form.skills          || undefined,
        gradeLevel:       form.gradeLevel      || undefined,
        yearsOfExperience: form.yearsOfExperience
          ? parseInt(form.yearsOfExperience)
          : undefined,
        schoolType:     form.schoolType     || undefined,
        city:           form.city           || undefined,
        schoolLocation: form.schoolLocation || undefined,
      });
      toast.success("Profile updated!");
      router.push("/profile");
    } catch {
      toast.error("Failed to save. Please try again.");
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#043658]">
        <Loader2 className="h-8 w-8 animate-spin text-[#FFC107]" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
        <form onSubmit={handleSubmit} className="flex min-h-full flex-col">

          {/* ── Navy header ─────────────────────────────────────────────── */}
          <div className="relative shrink-0 border-b-4 border-[#FFC107] bg-[#043658] px-4 py-8 sm:px-6 lg:px-8">
            {/* Grid pattern */}
            <div
              className="pointer-events-none absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 sm:flex-row">
              {/* Avatar + name */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#FFC107] bg-[#043658] text-2xl font-bold text-[#FFC107]">
                    {name
                      ? name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
                      : "··"}
                  </div>
                  <label className="absolute -bottom-2 -right-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#FFC107] text-[#043658] shadow-lg hover:bg-yellow-300 transition-colors">
                    <Camera className="h-3.5 w-3.5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhoto} disabled={isUploadingPhoto} />
                  </label>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#FFC107]">
                    TEACHER PROFILE
                  </p>
                  <h1 className="mt-0.5 text-2xl font-bold text-white">
                    {name || "Your Name"}
                  </h1>
                  <p className="text-sm text-white/60">
                    {(profile as any)?.profession || "Teacher"}
                    {(profile as any)?.department ? ` · ${(profile as any).department}` : ""}
                  </p>
                  <button
                    type="button"
                    className="mt-1 text-sm font-semibold text-[#FFC107] hover:underline"
                  >
                    Keep building
                  </button>
                </div>
              </div>

              {/* Progress ring */}
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full -rotate-90">
                    <circle cx="32" cy="32" r="26" strokeWidth="5" fill="none" stroke="rgba(255,255,255,0.1)" />
                    <circle
                      cx="32" cy="32" r="26" strokeWidth="5" fill="none"
                      stroke="#FFC107"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - pct / 100)}`}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{pct}%</span>
                  </div>
                </div>
                <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">
                  DONE
                </span>
              </div>
            </div>
          </div>

          {/* ── Step tabs ───────────────────────────────────────────────── */}
          <div className="relative shrink-0 border-b border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8 z-10">
            <div className="mx-auto max-w-5xl">
              <button
                type="button"
                onClick={() => router.push("/profile")}
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#043658] text-[#FFC107] hover:bg-[#043658]/90 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              {/* Track */}
              <div className="relative">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-slate-200" />
                <div
                  className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-[#FFC107] transition-all duration-300"
                  style={{
                    width: `${(STEPS.findIndex((s) => s.key === activeStep) / (STEPS.length - 1)) * 100}%`,
                  }}
                />
                <div className="relative flex items-center gap-3 overflow-x-auto pb-1">
                  {STEPS.map((step, idx) => {
                    const isActive  = activeStep === step.key;
                    const isDone    = sections[step.key as StepKey];
                    return (
                      <button
                        key={step.key}
                        type="button"
                        onClick={() => setActiveStep(step.key)}
                        className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                          isActive
                            ? "border-[#FFC107] bg-[#043658] text-white shadow-md ring-2 ring-[#043658] ring-offset-1"
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                            isActive
                              ? "bg-[#FFC107] text-[#043658]"
                              : isDone
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-3 w-3" /> : idx + 1}
                        </span>
                        {step.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl grid grid-cols-1 gap-6 lg:grid-cols-3">

              {/* Left — section form */}
              <div className="lg:col-span-2 space-y-4">

                {/* ── PERSONAL ──────────────────────────────────────── */}
                {activeStep === "personal" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <User className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[#043658]">Personal Information</h2>
                        <p className="text-[11px] text-slate-500">Your name and contact details</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="First Name">
                        <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="First name" className={inputCls} />
                      </Field>
                      <Field label="Last Name">
                        <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Last name" className={inputCls} />
                      </Field>
                      <Field label="Gender">
                        <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className={inputCls}>
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </Field>
                      <Field label="Phone Number">
                        <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+251 911 234 567" type="tel" className={inputCls} />
                      </Field>
                      <Field label="Email">
                        <input value={profile?.email ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="Teacher Level">
                        <input value={(profile?.level ?? "LEVEL_1").replace("_", " ")} disabled className={disabledCls} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Bio">
                          <textarea
                            value={form.bio}
                            onChange={(e) => set("bio", e.target.value)}
                            rows={3}
                            placeholder="Tell the community about yourself…"
                            className={`${inputCls} resize-none`}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── PROFESSIONAL ──────────────────────────────────── */}
                {activeStep === "professional" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <Briefcase className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[#043658]">Professional Information</h2>
                        <p className="text-[11px] text-slate-500">Your teaching background and expertise</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Profession">
                        <select value={form.profession} onChange={(e) => set("profession", e.target.value)} className={inputCls}>
                          <option value="">Select profession</option>
                          {PROFESSIONS.map((p) => (
                            <option key={p} value={p.toLowerCase()}>{p}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Specialization">
                        <input value={form.specialization} onChange={(e) => set("specialization", e.target.value)} placeholder="e.g. Mathematics, Physics" className={inputCls} />
                      </Field>
                      <Field label="Department">
                        <input value={(profile as any)?.department ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="Subject">
                        <input value={(profile as any)?.subject ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="Grade Level">
                        <select value={form.gradeLevel} onChange={(e) => set("gradeLevel", e.target.value)} className={inputCls}>
                          <option value="">Select grade level</option>
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Years of Experience">
                        <input
                          value={form.yearsOfExperience}
                          onChange={(e) => set("yearsOfExperience", e.target.value)}
                          placeholder="e.g. 5"
                          type="number"
                          min="0"
                          max="60"
                          className={inputCls}
                        />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Skills">
                          <textarea
                            value={form.skills}
                            onChange={(e) => set("skills", e.target.value)}
                            rows={2}
                            placeholder="e.g. Classroom Management, STEM, Curriculum Development"
                            className={`${inputCls} resize-none`}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── SCHOOL ────────────────────────────────────────── */}
                {activeStep === "school" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <School className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-[#043658]">School Information</h2>
                        <p className="text-[11px] text-slate-500">Details about your current school</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="School">
                        <input value={profile?.school ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="School Type">
                        <select value={form.schoolType} onChange={(e) => set("schoolType", e.target.value)} className={inputCls}>
                          <option value="">Select type</option>
                          {SCHOOL_TYPES.map((s) => (
                            <option key={s} value={s.toLowerCase()}>{s}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Region">
                        <input value={profile?.region ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="Zone">
                        <input value={profile?.zone ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="Woreda">
                        <input value={profile?.woreda ?? ""} disabled className={disabledCls} />
                      </Field>
                      <Field label="City">
                        <input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Addis Ababa" className={inputCls} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="School Location / Address">
                          <textarea
                            value={form.schoolLocation}
                            onChange={(e) => set("schoolLocation", e.target.value)}
                            rows={2}
                            placeholder="Full address or landmark of the school"
                            className={`${inputCls} resize-none`}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Nav + save buttons ─────────────────────────────── */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {activeStep !== "personal" && (
                      <button
                        type="button"
                        onClick={() => {
                          const idx = STEPS.findIndex((s) => s.key === activeStep);
                          setActiveStep(STEPS[idx - 1].key);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        ← Back
                      </button>
                    )}
                    {activeStep !== "school" && (
                      <button
                        type="button"
                        onClick={() => {
                          const idx = STEPS.findIndex((s) => s.key === activeStep);
                          setActiveStep(STEPS[idx + 1].key);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Next →
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 rounded-lg bg-[#043658] px-6 py-2 text-sm font-semibold text-white hover:bg-[#043658]/90 disabled:opacity-60 transition-colors"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>

              {/* Right — checklist sidebar ────────────────────────────── */}
              <div className="space-y-4">
                {/* Completion checklist */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="mb-3 text-sm font-semibold text-[#043658]">
                    Profile Completeness
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: "Name & contact", done: !!(form.firstName && form.lastName && form.phone) },
                      { label: "Bio",            done: !!form.bio },
                      { label: "Profession",     done: !!form.profession },
                      { label: "Specialization", done: !!form.specialization },
                      { label: "Skills",         done: !!form.skills },
                      { label: "Grade level",    done: !!form.gradeLevel },
                      { label: "School type",    done: !!form.schoolType },
                      { label: "City",           done: !!form.city },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-xs">
                        {item.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        <span className={item.done ? "text-slate-700" : "text-slate-400"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">Completion</span>
                      <span className="text-[11px] font-semibold text-[#043658]">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tips card */}
                <div className="rounded-xl border border-[#FFC107]/30 bg-[#FFC107]/5 p-4">
                  <p className="text-xs font-semibold text-[#043658] mb-1">💡 Tips</p>
                  <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                    <li>• A complete profile builds trust in the community.</li>
                    <li>• School, woreda &amp; zone can only change via a <span className="font-semibold text-[#043658]">Location Change Request</span>.</li>
                    <li>• Department &amp; subject are managed by administrators.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
