"use client";

import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { useVerification } from "@/hooks/useVerification";
import Button from "@/components/ui/Button";

interface VerificationStatusCardProps {
  profile: any;
}

export function VerificationStatusCard({}: VerificationStatusCardProps) {
  const router = useRouter();
  const { status, documents } = useVerification();

  if (!status) return null;

  const verificationStatus = status.verificationStatus;
  const docs = documents || [];
  const hasDocuments = documents && documents.length > 0;

  /* ─── STATE A: NOT VERIFIED (PENDING with no documents) ────────────── */
  if (verificationStatus === "PENDING" && docs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
              Teacher Verification Required
            </h3>
            <p className="text-xs text-slate-500">
              Complete your teacher information and submit verification documents.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            Complete your teacher information and submit the required documents
            to verify your teacher account and unlock community actions.
          </p>
        </div>

        <Button
          onClick={() => router.push("/verification-setup")}
          className="w-full"
        >
          Start Verification
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  /* ─── STATE B: PENDING ──────────────────────────────────────────────── */
  if (verificationStatus === "PENDING") {
    const hasNationalId = documents?.some(
      (d) => d.fileType === "NATIONAL_ID"
    );
    const hasTeacherCert = documents?.some(
      (d) => d.fileType === "TEACHER_ID"
    );
    const hasDegreeCert = documents?.some(
      (d) => d.fileType === "DEGREE_CERTIFICATE"
    );

    return (
      <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
              Verification Pending
            </h3>
            <p className="text-xs text-slate-500">
              Your documents are being reviewed
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4">
          <p className="text-xs text-amber-800 leading-relaxed">
            Your teacher information and documents have been submitted and are
            currently being reviewed by an administrator.
          </p>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            {hasTeacherCert ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
            <span
              className={
                hasTeacherCert ? "text-green-700" : "text-slate-500"
              }
            >
              Teacher certificate submitted
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {hasNationalId ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
            <span
              className={
                hasNationalId ? "text-green-700" : "text-slate-500"
              }
            >
              National ID submitted
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {hasDegreeCert ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Clock className="h-4 w-4 text-amber-500" />
            )}
            <span
              className={
                hasDegreeCert ? "text-green-700" : "text-slate-500"
              }
            >
              Degree certificate submitted
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-slate-500">
              Admin review in progress
            </span>
          </div>
        </div>

        <Button
          onClick={() => router.push("/verification-pending")}
          variant="secondary"
          className="w-full"
        >
          View Verification Status
        </Button>
      </div>
    );
  }

  /* ─── STATE C: APPROVED ─────────────────────────────────────────────── */
  if (verificationStatus === "APPROVED") {
    return (
      <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 border border-green-200">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
              Teacher Account Verified
            </h3>
            <p className="text-xs text-slate-500">
              Full community access enabled
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-4">
          <p className="text-xs text-green-800 leading-relaxed">
            Your teacher account has been verified. You now have access to
            protected community features.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700">
              Teacher information verified
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700">
              Documents approved
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-green-700">
              Community access enabled
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ─── STATE D: REJECTED ─────────────────────────────────────────────── */
  if (verificationStatus === "REJECTED") {
    return (
      <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 border border-red-200">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
              Verification Needs Attention
            </h3>
            <p className="text-xs text-slate-500">
              Please update and resubmit
            </p>
          </div>
        </div>

        {status.rejectionReason && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
            <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-1">
              Reason
            </p>
            <p className="text-xs text-red-800 leading-relaxed">
              {status.rejectionReason}
            </p>
          </div>
        )}

        <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 mb-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Please update the requested information or replace the document and
            resubmit your verification.
          </p>
        </div>

        <Button
          onClick={() => router.push("/verification-setup")}
          className="w-full"
        >
          Update Verification
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  }

  return null;
}
