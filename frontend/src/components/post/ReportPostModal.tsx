"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Ban,
  ShieldAlert,
  Zap,
  Flag,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { reportPost } from "@/services/community";

interface ReportPostModalProps {
  postId: string;
  postTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ReportReason {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const REPORT_REASONS: ReportReason[] = [
  {
    value: "ABUSE",
    label: "Abuse",
    description: "Harmful or offensive content",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    value: "SPAM",
    label: "Spam",
    description: "Unwanted or repetitive content",
    icon: <Ban className="h-5 w-5" />,
  },
  {
    value: "HARASSMENT",
    label: "Harassment",
    description: "Bullying or intimidation",
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  {
    value: "MISINFORMATION",
    label: "Misinformation",
    description: "False or misleading information",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Something else",
    icon: <Flag className="h-5 w-5" />,
  },
];

export function ReportPostModal({
  postId,
  postTitle,
  isOpen,
  onClose,
  onSuccess,
}: ReportPostModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Portal mounting
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setDescription("");
      setError(null);
      setShowSuccess(false);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const reportMutation = useMutation({
    mutationFn: () =>
      reportPost(postId, {
        reason: selectedReason as any,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      setShowSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Failed to submit report");
    },
  });

  const handleSubmit = () => {
    if (!selectedReason) {
      setError("Please select a reason");
      return;
    }
    reportMutation.mutate();
  };

  if (!isOpen) return null;
  if (!mounted) return null;

  const modalContent = (
    <>
      {/*
        Backdrop — sits at z-50, covers the whole screen.
        Click directly on it (not on the panel) → close.
      */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/*
        Panel — fixed and centered on the screen.
        z-[51] so it sits above the backdrop.
        Rendered via portal so it's outside the PostCard overflow constraints.
      */}
      <div
        className="fixed left-1/2 top-1/2 z-[51] w-full max-w-md -translate-x-1/2 -translate-y-1/2 
                   bg-white shadow-2xl rounded-2xl
                   flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="report-modal-title"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2
              id="report-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              Report Post
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
              &ldquo;{postTitle}&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={reportMutation.isPending}
            aria-label="Close report dialog"
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {REPORT_REASONS.map((reason) => (
            <button
              key={reason.value}
              type="button"
              onClick={() => {
                setSelectedReason(reason.value);
                setError(null);
              }}
              disabled={reportMutation.isPending}
              aria-pressed={selectedReason === reason.value}
              className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all
                ${
                  selectedReason === reason.value
                    ? "border-[#043658] bg-[#043658]/8 shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                }
                ${reportMutation.isPending ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              `}
            >
              <span
                className={`shrink-0 transition-colors ${
                  selectedReason === reason.value
                    ? "text-[#043658]"
                    : "text-slate-500"
                }`}
              >
                {reason.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span
                  className={`block text-sm font-semibold ${
                    selectedReason === reason.value
                      ? "text-[#043658]"
                      : "text-slate-900"
                  }`}
                >
                  {reason.label}
                </span>
                <span className="block text-xs text-slate-500">
                  {reason.description}
                </span>
              </span>
              {selectedReason === reason.value && (
                <span className="shrink-0 h-4 w-4 rounded-full bg-[#043658] flex items-center justify-center">
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 fill-white">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
            </button>
          ))}

          {/* Optional description */}
          {selectedReason && !showSuccess && (
            <div className="pt-3 border-t border-slate-100 space-y-1.5">
              <label
                htmlFor="report-description"
                className="block text-sm font-semibold text-slate-800"
              >
                Add details{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                id="report-description"
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                placeholder="Tell us more about this issue…"
                rows={3}
                maxLength={300}
                disabled={reportMutation.isPending}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm placeholder:text-slate-400
                           focus:border-[#043658] focus:bg-white focus:outline-none disabled:opacity-50 resize-none"
              />
              <p className="text-right text-xs text-slate-400">
                {description.length}/300
              </p>
            </div>
          )}

          {/* Error */}
          {error && !showSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          {showSuccess && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Report submitted
                </p>
                <p className="text-xs text-emerald-700">
                  Thanks for helping keep ServeLink safe
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-slate-100 px-5 py-4">
          <p className="mb-3 text-xs text-slate-400">
            Your report is anonymous and won&apos;t be shared with the creator.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={reportMutation.isPending}
              className="flex-1 rounded-full border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold
                         text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                !selectedReason || reportMutation.isPending || showSuccess
              }
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#043658] px-4 py-2.5
                         text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {reportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : showSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Sent
                </>
              ) : (
                "Submit Report"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
