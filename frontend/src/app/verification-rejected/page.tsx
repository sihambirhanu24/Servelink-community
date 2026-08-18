"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import VerificationRejected from "@/components/verification/VerificationRejected";
import { useVerification } from "@/hooks/useVerification";

export default function VerificationRejectedPage() {
  const router = useRouter();
  const { status, isLoading } = useVerification();

  // Redirect if approved
  useEffect(() => {
    if (status?.verificationStatus === "APPROVED") {
      router.push("/dashboard");
    }
  }, [status, router]);

  // Redirect if pending (shouldn't happen, but safety check)
  useEffect(() => {
    if (status?.verificationStatus === "PENDING") {
      router.push("/verification-pending");
    }
  }, [status, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#FFC107] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 font-medium">Loading your verification status...</p>
        </div>
      </div>
    );
  }

  return <VerificationRejected />;
}
