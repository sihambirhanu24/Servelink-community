"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  FileText,
  CheckCircle2,
  X,
  User,
  Briefcase,
  School,
  Lock,
  ArrowLeft,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { Avatar } from "@/components/common/Avatar";
import { useProfile } from "@/hooks/useProfile";
import { useUploadProfilePhoto } from "@/hooks/useUploadProfilePhoto";
import { useVerification } from "@/hooks/useVerification";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import Button from "@/components/ui/Button";

const REQUIRED_DOCUMENTS = [
  {
    key: "NATIONAL_ID",
    label: "National ID",
    description: "Government-issued national identification card",
    accepted: "PDF, JPG, PNG (Max 5MB)",
  },
  {
    key: "TEACHER_ID",
    label: "Teacher Certificate / Teacher ID",
    description: "Official teaching certificate or teacher ID card",
    accepted: "PDF, JPG, PNG (Max 5MB)",
  },
  {
    key: "DEGREE_CERTIFICATE",
    label: "Degree Certificate",
    description: "Highest academic degree certificate",
    accepted: "PDF, JPG, PNG (Max 5MB)",
  },
] as const;

const SCHOOL_TYPES = [
  "Government",
  "Private",
  "Missionary",
  "Community",
  "Other",
];

const PROFESSIONS = [
  "Teacher",
  "Lecturer",
  "Instructor",
  "Tutor",
  "Other",
];

const GRADE_LEVELS = [
  "Kindergarten",
  "Primary (1-4)",
  "Primary (5-8)",
  "Secondary (9-10)",
  "Secondary (11-12)",
  "Higher Education",
  "Other",
];

export default function VerificationSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { status, documents, uploadDocument, isUploading, refetch } =
    useVerification();
  const { mutateAsync: uploadPhoto, isPending: isUploadingPhoto } =
    useUploadProfilePhoto();

  const [activeSection, setActiveSection] = useState<string>("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File | null>>(
    {}
  );
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    gender: "",
    dateOfBirth: "",
    bio: "",
    phone: "",
    profession: "",
    teacherIdNumber: "",
    specialization: "",
    skills: "",
    gradeLevel: "",
    yearsOfExperience: "",
    schoolType: "",
    city: "",
    schoolLocation: "",
  });

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        ...prev,
        gender: (profile as any).gender || "",
        dateOfBirth: (profile as any).dateOfBirth
          ? String((profile as any).dateOfBirth).split("T")[0]
          : "",
        bio: (profile as any).bio || "",
        phone: (profile as any).phone || "",
        profession: (profile as any).profession || "",
        teacherIdNumber: (profile as any).teacherIdNumber || "",
        specialization: (profile as any).specialization || "",
        skills: (profile as any).skills || "",
        gradeLevel: (profile as any).gradeLevel || "",
        yearsOfExperience: (profile as any).yearsOfExperience?.toString() || "",
        schoolType: (profile as any).schoolType || "",
        city: (profile as any).city || "",
        schoolLocation: (profile as any).schoolLocation || "",
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (
      status?.verificationStatus === "PENDING" &&
      documents &&
      documents.length > 0
    ) {
      router.push("/verification-pending");
    }
  }, [status, documents, router]);

  const isRejected = status?.verificationStatus === "REJECTED";

  const checklist = [
    {
      key: "personal",
      label: "Personal information",
      done:
        !!(form.gender && form.dateOfBirth && form.bio && form.phone),
    },
    {
      key: "professional",
      label: "Professional information",
      done:
        !!(
          form.profession &&
          form.specialization &&
          form.skills &&
          form.gradeLevel &&
          form.yearsOfExperience
        ),
    },
    {
      key: "school",
      label: "School information",
      done:
        !!(
          profile?.school &&
          form.schoolType &&
          form.city &&
          form.schoolLocation
        ),
    },
    {
      key: "nationalId",
      label: "National ID",
      done:
        !!uploadedDocs["NATIONAL_ID"] ||
        documents?.some((d: any) => d.fileType === "NATIONAL_ID"),
    },
    {
      key: "teacherCert",
      label: "Teacher certificate",
      done:
        !!uploadedDocs["TEACHER_ID"] ||
        documents?.some((d: any) => d.fileType === "TEACHER_ID"),
    },
    {
      key: "degreeCert",
      label: "Degree certificate",
      done:
        !!uploadedDocs["DEGREE_CERTIFICATE"] ||
        documents?.some(
          (d: any) => d.fileType === "DEGREE_CERTIFICATE"
        ),
    },
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const allComplete = completedCount === checklist.length;

  function handleInputChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    try {
      await uploadPhoto(file);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo");
    }
    e.target.value = "";
  }

  // Buffer the file locally — nothing is sent to the server until Submit is clicked
  function handleDocumentUpload(docType: string, file: File) {
    setUploadErrors((prev) => ({ ...prev, [docType]: "" }));
    if (file.size > 5 * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [docType]: "File size must be less than 5MB",
      }));
      return;
    }
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!allowed.includes(file.type)) {
      setUploadErrors((prev) => ({
        ...prev,
        [docType]: "Only PDF, JPG, PNG are allowed",
      }));
      return;
    }
    // Store locally — will be uploaded when Submit is clicked
    setUploadedDocs((prev) => ({ ...prev, [docType]: file }));
  }

  async function handleRemoveDocument(documentId: string) {
    try {
      await api.delete(`/verification/documents/${documentId}`);
      toast.success("Document removed");
      await refetch();
    } catch {
      toast.error("Failed to remove document");
    }
  }

  async function handleSubmit() {
    if (!allComplete) {
      toast.error("Please complete all required fields and documents");
      return;
    }
    setShowConfirmDialog(true);
  }

  async function confirmSubmit() {
    setIsSubmitting(true);
    try {
      console.log('[Verification Submit] Starting submission...');
      console.log('[Verification Submit] Current documents:', documents);
      console.log('[Verification Submit] Locally uploaded docs:', uploadedDocs);
      console.log('[Verification Submit] Is rejected:', isRejected);

      // 1. Upload any locally-buffered documents that haven't been sent yet
      const pendingUploads = Object.entries(uploadedDocs).filter(
        ([docType, file]) =>
          file !== null &&
          !documents?.some((d: any) => d.fileType === docType),
      );

      console.log('[Verification Submit] Pending uploads:', pendingUploads.length);

      for (const [docType, file] of pendingUploads) {
        if (file) {
          console.log(`[Verification Submit] Uploading ${docType}:`, file.name);
          await uploadDocument(file, docType);
          console.log(`[Verification Submit] Successfully uploaded ${docType}`);
        }
      }

      // 2. Save form data and submit for verification (this also sets status to PENDING)
      console.log('[Verification Submit] Saving form data...');
      await api.patch("/verification/setup", {
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        bio: form.bio,
        phone: form.phone,
        profession: form.profession,
        teacherIdNumber: form.teacherIdNumber,
        specialization: form.specialization,
        skills: form.skills,
        gradeLevel: form.gradeLevel,
        yearsOfExperience: form.yearsOfExperience
          ? parseInt(form.yearsOfExperience)
          : undefined,
        schoolType: form.schoolType,
        city: form.city,
      });

      console.log('[Verification Submit] Form data saved successfully');
      toast.success(isRejected ? "Verification resubmitted for review!" : "Verification submitted for review!");
      router.push("/verification-pending");
    } catch (error: any) {
      console.error("[Verification Submit] Error:", error);
      console.error("[Verification Submit] Error response:", error?.response?.data);
      const errorMessage = error?.response?.data?.message || error.message || "Failed to submit verification";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
      setShowConfirmDialog(false);
    }
  }

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#043658]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FFC107] border-t-transparent" />
      </div>
    );
  }

  const name = `${profile?.firstName ?? user?.firstName ?? ""} ${profile?.lastName ?? user?.lastName ?? ""}`.trim();

  if (status?.verificationStatus === "APPROVED") {
    return (
      <div className="flex h-screen flex-col bg-[#F5F8FB]">
        <DashboardSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-green-200 bg-white p-8 shadow-sm text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 border border-green-200 mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="font-['Lexend'] font-semibold text-[#043658] text-xl mb-2">
                Teacher Account Verified
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                Your teacher account has already been verified. You have full access to all community features.
              </p>
              <button
                onClick={() => router.push("/profile")}
                className="rounded-lg bg-[#043658] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#043658]/90 transition-colors"
              >
                Back to Profile
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[#F5F8FB]">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col min-h-full">
          {/* ─── Profile Header ─────────────────────────────────────────── */}
        <div className="bg-[#043658] px-4 py-8 sm:px-6 lg:px-8 relative shrink-0 border-b-4 border-[#FFC107]">
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-2xl border-2 border-[#FFC107] flex items-center justify-center bg-[#043658] text-[#FFC107] font-bold text-3xl">
                  {name ? name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "MM"}
                </div>
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-[#FFC107] flex items-center justify-center text-[#043658] shadow-lg cursor-pointer hover:bg-yellow-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                </div>
              </div>
              <div>
                <p className="text-[#FFC107] text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                  TEACHER PROFILE
                </p>
                <h1 className="text-white text-3xl font-bold mb-1">{name || "Meryem Mussa"}</h1>
                <p className="text-white/70 text-sm mb-2">{profile?.department || "Teacher"}</p>
                <button className="text-[#FFC107] text-sm font-semibold hover:underline">Keep building</button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition-colors text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                Add cover banner
              </button>

              <div className="flex flex-col items-center justify-center ml-6">
                <div className="relative h-16 w-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                    <circle cx="32" cy="32" r="28" stroke="#FFC107" strokeWidth="4" fill="none" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * (completedCount * 16)) / 100} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{completedCount * 16}%</span>
                  </div>
                </div>
                <span className="text-white/60 text-[10px] uppercase font-bold mt-1">DONE</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Progress Steps ───────────────────────────────────────────── */}
        <div className="bg-white px-4 pt-6 pb-4 sm:px-6 lg:px-8 shrink-0 relative shadow-sm z-10">
          <div className="max-w-5xl mx-auto relative">
            <button
              onClick={() => router.push("/profile")}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center h-10 w-10 bg-[#043658] text-[#FFC107] rounded-xl hover:bg-[#043658]/90 transition-colors z-20"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="pl-14 sm:pl-16">
              <p className="text-xs font-bold text-[#043658] uppercase tracking-widest mb-3">
                STEP {["personal", "professional", "school", "documents"].indexOf(activeSection) + 1} OF 4
              </p>

              <div className="relative">
                {/* Background track line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-200 -translate-y-1/2 z-0" />
                {/* Active track line */}
                <div
                  className="absolute top-1/2 left-0 h-[2px] bg-[#FFC107] -translate-y-1/2 z-0 transition-all duration-300"
                  style={{ width: `${((["personal", "professional", "school", "documents"].indexOf(activeSection)) / 3) * 100}%` }}
                />

                <div className="relative z-10 flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {[
                    { key: "personal", label: "Profile", progress: "9%" },
                    { key: "professional", label: "Profession", progress: "17%" },
                    { key: "school", label: "School", progress: "0%" },
                    { key: "documents", label: "Supporting documents", progress: "0%" },
                  ].map((step, idx) => {
                    const isActive = activeSection === step.key;

                    return (
                      <button
                        key={step.key}
                        onClick={() => setActiveSection(step.key)}
                        className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${isActive
                            ? "bg-[#043658] border-[#FFC107] text-white shadow-md ring-2 ring-[#043658] ring-offset-1"
                            : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                          }`}
                      >
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${isActive ? 'bg-[#FFC107] text-[#043658]' : 'bg-slate-100 text-slate-500'}`}>
                          {idx + 1}
                        </span>
                        <span>{step.label}</span>
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${isActive ? 'bg-[#FFC107] text-[#043658]' : 'bg-slate-100 text-slate-500'}`}>
                          {step.progress}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Main Content ─────────────────────────────────────────────── */}
        <main className="flex-1">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Left: Form */}
              <div className="space-y-4 lg:col-span-2">
                {/* Personal Information */}
                {activeSection === "personal" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <User className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-['Lexend'] font-semibold text-[#043658] text-base">
                          Personal Information
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Basic identity and contact details
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 flex items-center gap-3">
                      <Avatar
                        name={name}
                        profileImage={profile?.profileImage}
                        size="md"
                        className="ring-2 ring-slate-100"
                      />
                      <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#043658] hover:bg-slate-50 transition-colors">
                        {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto}
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Full Name
                        </label>
                        <input
                          value={name}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Gender
                        </label>
                        <select
                          value={form.gender}
                          onChange={(e) =>
                            handleInputChange("gender", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 bg-white"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          value={form.dateOfBirth}
                          onChange={(e) =>
                            handleInputChange("dateOfBirth", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) =>
                            handleInputChange("phone", e.target.value)
                          }
                          placeholder="+251 911 234 567"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Bio
                        </label>
                        <textarea
                          value={form.bio}
                          onChange={(e) =>
                            handleInputChange("bio", e.target.value)
                          }
                          rows={2}
                          placeholder="Tell us about yourself..."
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Professional Information */}
                {activeSection === "professional" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <Briefcase className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-['Lexend'] font-semibold text-[#043658] text-base">
                          Professional Information
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Your teaching background and expertise
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Profession
                        </label>
                        <select
                          value={form.profession}
                          onChange={(e) =>
                            handleInputChange("profession", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 bg-white"
                        >
                          <option value="">Select profession</option>
                          {PROFESSIONS.map((p) => (
                            <option key={p} value={p.toLowerCase()}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Teacher ID Number
                        </label>
                        <input
                          value={form.teacherIdNumber}
                          onChange={(e) =>
                            handleInputChange("teacherIdNumber", e.target.value)
                          }
                          placeholder="e.g. faydaid, TID12345"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Teacher Specialization
                        </label>
                        <input
                          value={form.specialization}
                          onChange={(e) =>
                            handleInputChange("specialization", e.target.value)
                          }
                          placeholder="e.g. Mathematics, Physics"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Department
                        </label>
                        <input
                          value={profile?.department || ""}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Teaching Subjects
                        </label>
                        <input
                          value={profile?.subject || ""}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Grade Level
                        </label>
                        <select
                          value={form.gradeLevel}
                          onChange={(e) =>
                            handleInputChange("gradeLevel", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 bg-white"
                        >
                          <option value="">Select grade level</option>
                          {GRADE_LEVELS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={form.yearsOfExperience}
                          onChange={(e) =>
                            handleInputChange(
                              "yearsOfExperience",
                              e.target.value
                            )
                          }
                          placeholder="e.g. 5"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Skills
                        </label>
                        <textarea
                          value={form.skills}
                          onChange={(e) =>
                            handleInputChange("skills", e.target.value)
                          }
                          rows={2}
                          placeholder="e.g. Classroom Management, Curriculum Development, STEM Education"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* School Information */}
                {activeSection === "school" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <School className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-['Lexend'] font-semibold text-[#043658] text-base">
                          School Information
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Details about your current school
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          School
                        </label>
                        <input
                          value={profile?.school || ""}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          School Type
                        </label>
                        <select
                          value={form.schoolType}
                          onChange={(e) =>
                            handleInputChange("schoolType", e.target.value)
                          }
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 bg-white"
                        >
                          <option value="">Select school type</option>
                          {SCHOOL_TYPES.map((s) => (
                            <option key={s} value={s.toLowerCase()}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Region
                        </label>
                        <input
                          value={profile?.region || ""}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Zone
                        </label>
                        <input
                          value={profile?.zone || ""}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          Woreda
                        </label>
                        <input
                          value={profile?.woreda || ""}
                          disabled
                          className="w-full rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs text-slate-400 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          City
                        </label>
                        <input
                          value={form.city}
                          onChange={(e) =>
                            handleInputChange("city", e.target.value)
                          }
                          placeholder="e.g. Addis Ababa"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-slate-600">
                          School Location
                        </label>
                        <textarea
                          value={form.schoolLocation}
                          onChange={(e) =>
                            handleInputChange("schoolLocation", e.target.value)
                          }
                          rows={2}
                          placeholder="Full address or landmark of the school"
                          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-[#043658] placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#043658]/20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Documents */}
                {activeSection === "documents" && (
                  <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#043658]/10">
                        <FileText className="h-4 w-4 text-[#043658]" />
                      </div>
                      <div>
                        <h2 className="font-['Lexend'] font-semibold text-[#043658] text-base">
                          Verification Documents
                        </h2>
                        <p className="text-[11px] text-slate-500">
                          Documents used to verify your teacher identity
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {REQUIRED_DOCUMENTS.map((doc) => {
                        const existingDoc = documents?.find(
                          (d: any) => d.fileType === doc.key
                        );
                        const uploadError = uploadErrors[doc.key];

                        return (
                          <div
                            key={doc.key}
                            className="rounded-lg border border-slate-200 p-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                                  <FileText className="h-4 w-4 text-[#043658]" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-700">
                                    {doc.label}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {doc.description}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">
                                    {doc.accepted}
                                  </p>
                                  {existingDoc && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-green-700 bg-green-50 rounded-md px-2 py-1 w-fit">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span className="truncate max-w-[180px]">
                                        {existingDoc.fileName}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleRemoveDocument(existingDoc.id)
                                        }
                                        className="ml-1 text-slate-400 hover:text-red-600 transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                  {/* Locally-buffered file (not yet sent to server) */}
                                  {!existingDoc && uploadedDocs[doc.key] && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 w-fit">
                                      <CheckCircle2 className="h-3 w-3" />
                                      <span className="truncate max-w-[180px]">
                                        {uploadedDocs[doc.key]!.name}
                                      </span>
                                      <span className="text-amber-500 ml-1">
                                        (pending submit)
                                      </span>
                                      <button
                                        onClick={() =>
                                          setUploadedDocs((prev) => {
                                            const next = { ...prev };
                                            delete next[doc.key];
                                            return next;
                                          })
                                        }
                                        className="ml-1 text-amber-400 hover:text-red-600 transition-colors"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  )}
                                  {uploadError && (
                                    <p className="mt-1 text-[11px] text-red-600">
                                      {uploadError}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!existingDoc && !uploadedDocs[doc.key] && (
                                <label className="shrink-0 cursor-pointer rounded-md border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-[#043658] hover:bg-slate-50 transition-colors">
                                  Upload
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        handleDocumentUpload(doc.key, file);
                                      e.target.value = "";
                                    }}
                                    disabled={isUploading}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 rounded-md bg-slate-50 border border-slate-100 p-2.5">
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        <Lock className="h-3 w-3 inline mr-1" />
                        Documents are visible only to authorized administrators.
                        Your information is kept confidential and secure.
                      </p>
                    </div>
                  </div>
                )}

                {/* Checklist & Submit */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                  <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">
                    Teacher Verification Checklist
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {checklist.map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center gap-2 text-xs"
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        ) : (
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 shrink-0" />
                        )}
                        <span
                          className={
                            item.done ? "text-slate-700" : "text-slate-400"
                          }
                        >
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {!allComplete && (
                      <p className="text-[11px] text-slate-500 mb-2">
                        {checklist.length - completedCount} item
                        {checklist.length - completedCount !== 1 ? "s" : ""}{" "}
                        remaining
                      </p>
                    )}
                    <Button
                      onClick={handleSubmit}
                      disabled={!allComplete || isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting
                        ? "Submitting..."
                        : isRejected
                          ? "Update & Resubmit Verification"
                          : "Submit for Verification"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div className="space-y-3">
                {/* Account Status */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-2.5">
                    Account Status
                  </h3>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">
                        Profile Completeness
                      </span>
                      <span className="text-[11px] font-semibold text-[#043658]">
                        {completedCount * 16}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
                        style={{
                          width: `${Math.min(completedCount * 16, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-2.5">
                    <p className="text-[11px] font-semibold text-slate-600 mb-1.5">
                      Teacher Verification
                    </p>
                    {status?.verificationStatus === "PENDING" ? (
                      <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-md px-2.5 py-2">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">
                          Pending Review
                        </span>
                      </div>
                    ) : status?.verificationStatus === "REJECTED" ? (
                      <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-md px-2.5 py-2">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">
                          Needs Attention
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-600 bg-slate-50 rounded-md px-2.5 py-2">
                        <Lock className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-medium">
                          Verification Required
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Help Card */}
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-2">
                    Why Verify?
                  </h3>
                  <ul className="space-y-1.5 text-[11px] text-slate-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                      Create posts and share resources
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                      Comment and engage with communities
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                      Access higher-level communities
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 shrink-0" />
                      Earn progression points and level up
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-xl bg-white shadow-xl">
              <div className="p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FFC107]/20">
                    <Shield className="h-4 w-4 text-[#043658]" />
                  </div>
                  <h3 className="font-['Lexend'] font-semibold text-[#043658] text-base">
                    Submit Teacher Verification?
                  </h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Once submitted, your information and documents will be sent to
                  the ServeLink administration team for review. This process
                  typically takes 1-2 business days.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 p-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
