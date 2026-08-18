"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, AlertCircle, CheckCircle } from "lucide-react";
import { useVerification } from "@/hooks/useVerification";

const DOCUMENT_TYPES = [
  { value: "TEACHER_ID", label: "Teacher ID Card" },
  { value: "EMPLOYMENT_LETTER", label: "Employment Letter" },
  { value: "TEACHING_CERTIFICATE", label: "Teaching Certificate" },
  { value: "OTHER", label: "Other Document" },
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

export default function VerificationUpload() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>("TEACHER_ID");
  const [error, setError] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const { uploadDocument, isUploading, status } = useVerification();

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be less than 5MB";
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Only PDF, DOCX, JPG, and PNG files are allowed";
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
    setUploadSuccess(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError("");
    setUploadSuccess(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    try {
      await uploadDocument(selectedFile, documentType);
      setUploadSuccess(true);
      setSelectedFile(null);
      setError("");

      // If teacher was REJECTED, the backend automatically transitions to PENDING
      // Redirect to verification-pending page after successful upload
      if (status?.verificationStatus === "REJECTED") {
        setTimeout(() => {
          router.push("/verification-pending");
        }, 1500);
      } else {
        // Reset success message after 3 seconds for non-rejected teachers
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload document");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Verification Documents
      </h3>

      <div className="space-y-4">
        {/* Document Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isUploading}
          >
            {DOCUMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, JPG, PNG (MAX. 5MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {uploadSuccess && (
          <div className="flex items-start space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">
              {status?.verificationStatus === "REJECTED"
                ? "Document uploaded successfully! Your verification has been resubmitted and is now pending admin review."
                : "Document uploaded successfully! Our admin team will review it shortly."}
            </p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>

        {/* Info Text */}
        <p className="text-xs text-gray-500 text-center">
          Please upload clear, readable documents. All uploads are secure and only visible to administrators.
        </p>
      </div>
    </div>
  );
}
