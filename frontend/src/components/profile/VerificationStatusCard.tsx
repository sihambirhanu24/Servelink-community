"use client";

import { useState } from "react";
import { BadgeCheck, Clock, ShieldAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useMyVerification, useResubmitVerification } from "@/hooks/useVerification";
import { getErrorMessage } from "@/lib/error-message";
import { VerificationDocumentsField } from "@/components/auth/verification-documents-field";
import {
  VerificationDocumentsSchema,
  type VerificationDocumentValue,
} from "@/lib/auth-schemas";

const STATUS_COPY = {
  PENDING: {
    label: "Pending",
    message: "Your teacher verification is under review.",
    className: "bg-[#FFC107]/15 text-[#8a6100] border-[#FFC107]/40",
    Icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    message: "Your teacher account has been verified.",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Icon: BadgeCheck,
  },
  REJECTED: {
    label: "Rejected",
    message: "Your verification was rejected.",
    className: "bg-red-50 text-red-700 border-red-200",
    Icon: ShieldAlert,
  },
} as const;

/**
 * Shows the backend-owned verification state and, after a rejection, lets the
 * teacher resubmit documents (REJECTED → PENDING).
 */
export function VerificationStatusCard() {
  const { data: verification, isLoading } = useMyVerification();
  const resubmit = useResubmitVerification();

  const [isResubmitting, setIsResubmitting] = useState(false);
  const [documents, setDocuments] = useState<VerificationDocumentValue[]>([]);
  const [documentsError, setDocumentsError] = useState<string>();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (!verification) return null;

  const status = STATUS_COPY[verification.verificationStatus];
  const { Icon } = status;

  const onResubmit = async () => {
    const parsed = VerificationDocumentsSchema.safeParse(documents);
    if (!parsed.success) {
      setDocumentsError(parsed.error.issues[0]?.message);
      return;
    }

    try {
      await resubmit.mutateAsync(documents);
      toast.success("Documents submitted. Your verification is under review.");
      setIsResubmitting(false);
      setDocuments([]);
      setDocumentsError(undefined);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-['Lexend'] text-sm font-semibold text-[#043658]">
          Verification Status
        </h3>
        <span
          className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {status.label}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-600">{status.message}</p>

      {verification.verificationStatus === "REJECTED" &&
        verification.rejectionReason && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
            <p className="text-[11px] font-semibold text-red-700">Reason</p>
            <p className="mt-0.5 text-xs text-red-700">
              {verification.rejectionReason}
            </p>
          </div>
        )}

      {verification.verificationDocuments.length > 0 && (
        <ul className="mt-3 space-y-1">
          {verification.verificationDocuments.map((document) => (
            <li
              key={document.id}
              className="truncate text-[11px] text-slate-500"
            >
              {document.fileName} · {document.documentType.replace(/_/g, " ")}
            </li>
          ))}
        </ul>
      )}

      {verification.verificationStatus === "REJECTED" && !isResubmitting && (
        <button
          onClick={() => setIsResubmitting(true)}
          className="mt-3 w-full rounded-lg bg-[#043658] py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 transition-colors"
        >
          Resubmit Documents
        </button>
      )}

      {isResubmitting && (
        <div className="mt-3">
          <VerificationDocumentsField
            documents={documents}
            onChange={(next) => {
              setDocuments(next);
              setDocumentsError(undefined);
            }}
            error={documentsError}
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={onResubmit}
              disabled={resubmit.isPending}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#043658] py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 transition-colors disabled:opacity-60"
            >
              {resubmit.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Submit for review
            </button>
            <button
              onClick={() => {
                setIsResubmitting(false);
                setDocuments([]);
                setDocumentsError(undefined);
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
