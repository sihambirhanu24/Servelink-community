"use client";

import { AlertCircle, CheckCircle, Clock, FileText, Trash2, XCircle } from "lucide-react";
import { useVerification } from "@/hooks/useVerification";
import { formatDistanceToNow } from "date-fns";

export default function VerificationStatus() {
  const { status, documents, isLoading, deleteDocument, resubmit, isResubmitting } = useVerification();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (status?.verificationStatus) {
      case "APPROVED":
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            <span>Verified</span>
          </div>
        );
      case "PENDING":
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Pending Review</span>
          </div>
        );
      case "REJECTED":
        return (
          <div className="flex items-center space-x-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
            <XCircle className="w-4 h-4" />
            <span>Rejected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusMessage = () => {
    switch (status?.verificationStatus) {
      case "APPROVED":
        return {
          icon: <CheckCircle className="w-12 h-12 text-green-600" />,
          title: "Your account is verified! 🎉",
          description: `Verified on ${status.approvedAt ? new Date(status.approvedAt).toLocaleDateString() : ""}. You have full access to all ServeLink Community features.`,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "PENDING":
        return {
          icon: <Clock className="w-12 h-12 text-yellow-600" />,
          title: "Verification in Progress",
          description:
            "Our admin team is reviewing your documents. This usually takes 1-2 business days. You'll receive a notification once your account is verified.",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
        };
      case "REJECTED":
        return {
          icon: <XCircle className="w-12 h-12 text-red-600" />,
          title: "Verification Rejected",
          description: status?.rejectionReason || "Your verification was rejected. Please upload new documents and resubmit.",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
        };
      default:
        return {
          icon: <AlertCircle className="w-12 h-12 text-gray-600" />,
          title: "Verification Required",
          description: "Please upload your verification documents to access full community features.",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        };
    }
  };

  const statusInfo = getStatusMessage();

  const handleDelete = async (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocument(documentId);
      } catch (error) {
        console.error("Failed to delete document:", error);
      }
    }
  };

  const handleResubmit = async () => {
    if (confirm("Ready to resubmit your verification? Make sure you've uploaded all required documents.")) {
      try {
        await resubmit();
      } catch (error) {
        console.error("Failed to resubmit:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-lg shadow-sm border ${statusInfo.borderColor} ${statusInfo.bgColor} p-6`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">{statusInfo.icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{statusInfo.title}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-gray-700">{statusInfo.description}</p>

            {status?.verificationStatus === "REJECTED" && documents && documents.length > 0 && (
              <button
                onClick={handleResubmit}
                disabled={isResubmitting}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium text-sm"
              >
                {isResubmitting ? "Resubmitting..." : "Resubmit for Review"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploaded Documents */}
      {documents && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Uploaded Documents</h4>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="capitalize">
                        {doc.fileType.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span>•</span>
                      <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                      <span>•</span>
                      <span>
                        Uploaded {formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {status?.verificationStatus !== "APPROVED" && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Documents Message */}
      {(!documents || documents.length === 0) && status?.verificationStatus !== "APPROVED" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-8">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Documents Uploaded</h4>
            <p className="text-gray-600">
              Upload your verification documents to get started with the approval process.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
