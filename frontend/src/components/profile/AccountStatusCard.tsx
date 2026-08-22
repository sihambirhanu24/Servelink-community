"use client";

import { CheckCircle2, Shield, Lock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useVerification } from "@/hooks/useVerification";

interface AccountStatusCardProps {
  profile: any;
}

export function AccountStatusCard({ profile }: AccountStatusCardProps) {
  const { status } = useVerification();

  /* ─── Profile completeness ─────────────────────────────────────────── */
  const fields = [
    profile?.firstName,
    profile?.lastName,
    profile?.email,
    profile?.profileImage,
    profile?.school,
    profile?.woreda,
    profile?.zone,
    profile?.region,
    profile?.subject,
    profile?.department,
  ];
  const filled = fields.filter((f) => f && String(f).trim() !== "").length;
  const completeness = Math.round((filled / fields.length) * 100);

  const nextStep =
    !profile?.profileImage
      ? "Profile photo"
      : !profile?.subject
      ? "Subject"
      : !profile?.department
      ? "Department"
      : null;

  /* ─── Verification status ──────────────────────────────────────────── */
  const isVerified = status?.verificationStatus === "APPROVED";
  const isPending = status?.verificationStatus === "PENDING";
  const isRejected = status?.verificationStatus === "REJECTED";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      {/* Profile Completeness */}
      <div>
        <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">
          Account Status
        </h3>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-slate-500">
              Profile Completeness
            </span>
            <span className="text-xs font-semibold text-[#043658]">
              {completeness}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#FFC107] transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
        </div>

        {nextStep && (
          <p className="text-xs text-slate-400 mb-3">
            Next: {nextStep}
          </p>
        )}

        <Link href="/profile/edit">
          <button className="w-full rounded-lg border border-slate-200 py-2 text-xs font-semibold text-[#043658] hover:bg-slate-50 transition-colors">
            Complete Setup
          </button>
        </Link>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100" />

      {/* Teacher Verification */}
      <div>
        <p className="text-xs font-semibold text-slate-600 mb-2">
          Teacher Verification
        </p>

        {isVerified ? (
          <div className="flex items-center gap-2 text-green-700 bg-green-50 rounded-lg px-3 py-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">
              Verified — Full community access enabled
            </span>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-2 text-amber-700 bg-amber-50 rounded-lg px-3 py-2.5">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">
              Pending Review — Documents under review
            </span>
          </div>
        ) : isRejected ? (
          <div className="flex items-center gap-2 text-red-700 bg-red-50 rounded-lg px-3 py-2.5">
            <Shield className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">
              Verification Needs Attention
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 rounded-lg px-3 py-2.5">
            <Lock className="h-4 w-4 shrink-0" />
            <span className="text-xs font-medium">
              Verification Required
            </span>
          </div>
        )}

        {!isVerified && (
          <Link href="/verification-setup" className="block mt-3">
            <button className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#043658] py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 transition-colors">
              {isPending
                ? "View Verification Status"
                : isRejected
                ? "Update Verification"
                : "Start Verification"}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
