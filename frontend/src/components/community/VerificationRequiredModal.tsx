"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";

interface VerificationRequiredModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function VerificationRequiredModal({ isOpen, onClose }: VerificationRequiredModalProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleShowModal = () => setOpen(true);
    const handleHideModal = () => setOpen(false);

    window.addEventListener("show-verification-modal", handleShowModal);
    window.addEventListener("hide-verification-modal", handleHideModal);

    return () => {
      window.removeEventListener("show-verification-modal", handleShowModal);
      window.removeEventListener("hide-verification-modal", handleHideModal);
    };
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleVerify = () => {
    handleClose();
    router.push("/verification-pending");
  };

  if (!open && !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <ShieldAlert className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#043658]">Teacher Verification Required</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Please verify your teacher account before performing this action. This helps us maintain a secure and trusted community environment.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleVerify}
            className="flex-1 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#032742]"
          >
            Verify Account
          </button>
        </div>
      </div>
    </div>
  );
}
