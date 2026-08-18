"use client";

import { AlertCircle, CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useVerification } from "@/hooks/useVerification";

export default function VerificationBanner() {
  const { status, isLoading } = useVerification();

  if (isLoading || !status) return null;

  // Don't show banner if already approved
  if (status.verificationStatus === "APPROVED") return null;

  const getBannerConfig = () => {
    switch (status.verificationStatus) {
      case "PENDING":
        return {
          icon: <Clock className="w-6 h-6 text-yellow-600" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-300",
          textColor: "text-yellow-900",
          title: "Verification Pending",
          message:
            "Your verification documents are under review. You'll be notified once approved. Some features are limited until verification is complete.",
          actionText: "View Status",
          actionColor: "bg-yellow-600 hover:bg-yellow-700",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-300",
          textColor: "text-red-900",
          title: "Verification Rejected",
          message: status.rejectionReason || "Your verification was rejected. Please upload new documents and resubmit.",
          actionText: "Upload Documents",
          actionColor: "bg-red-600 hover:bg-red-700",
        };
      default:
        return {
          icon: <AlertCircle className="w-6 h-6 text-blue-600" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-300",
          textColor: "text-blue-900",
          title: "Verification Required",
          message:
            "Complete your teacher verification to access all community features, create posts, and earn progression points.",
          actionText: "Get Verified",
          actionColor: "bg-blue-600 hover:bg-blue-700",
        };
    }
  };

  const config = getBannerConfig();

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border-l-4 rounded-lg p-4 mb-6 shadow-sm`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{config.icon}</div>
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-semibold ${config.textColor}`}>
            {config.title}
          </h3>
          <p className={`mt-1 text-sm ${config.textColor} opacity-90`}>
            {config.message}
          </p>
          <Link
            href="/verification"
            className={`inline-flex items-center mt-3 px-4 py-2 text-sm font-medium text-white ${config.actionColor} rounded-lg transition-colors`}
          >
            {config.actionText}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
