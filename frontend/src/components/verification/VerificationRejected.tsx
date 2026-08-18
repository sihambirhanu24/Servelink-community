"use client";

import {
  AlertTriangle,
  XCircle,
  School,
  User,
  BookOpen,
  CheckCircle,
  LogOut,
  FileText,
  AlertCircle,
  MessageCircle,
  ArrowRight,
  Mail,
  Clock,
  ShieldAlert,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useVerification } from "@/hooks/useVerification";
import VerificationUpload from "./VerificationUpload";

export default function VerificationRejected() {
  const router = useRouter();
  const { status, resubmit, isResubmitting } = useVerification();

  // Get teacher info from localStorage
  const getTeacherInfo = () => {
    if (typeof window !== "undefined") {
      const teacherData = localStorage.getItem("teacher");
      if (teacherData) {
        try {
          return JSON.parse(teacherData);
        } catch {
          return null;
        }
      }
    }
    return null;
  };

  const teacher = getTeacherInfo();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("teacher");
    router.push("/auth/login");
  };

  const handleResubmit = async () => {
    // This function is no longer needed since upload automatically transitions status
    // The teacher simply uploads a new document and is redirected to pending page
    // Kept for backward compatibility but does nothing
    console.log("Manual resubmit is deprecated. Upload a document to automatically resubmit.");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      {/* Animated Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-red-200 sticky top-0 z-50 shadow-sm">
        <div className="w-full px-2 sm:px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <span className="text-white font-bold text-lg">SL</span>
              </div>
              <div>
                <span className="font-bold text-[#043658] text-xl">ServeLink</span>
                <p className="text-xs text-red-600 font-medium">Verification Review Required</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-2 sm:px-4 lg:px-6 py-6">
        {/* Alert Hero Section */}
        <div className="relative bg-gradient-to-r from-red-100 via-red-50 to-orange-100 border-2 border-red-300 rounded-2xl p-8 mb-8 shadow-2xl overflow-hidden animate-fade-in">
          {/* Animated background circles */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30 animate-pulse" style={{animationDelay: '1s'}}></div>
          
          <div className="relative flex items-start space-x-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-xl animate-bounce-slow">
                <ShieldAlert className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h1 className="text-3xl font-bold text-red-900">Verification Rejected</h1>
                <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                  Action Required
                </div>
              </div>
              <p className="text-lg text-red-800 mb-4">
                We were unable to verify your account information. Please review the details below and resubmit.
              </p>
              <div className="flex items-center space-x-2 text-sm text-red-700">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Rejected on {status?.approvedAt ? new Date().toLocaleDateString() : 'recently'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection Reason - Highlighted */}
        {status?.rejectionReason && (
          <div className="bg-white rounded-xl border-2 border-red-300 shadow-lg p-6 mb-8 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-[#043658] mb-3">Reason for Rejection</h2>
                <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-red-900 mb-2 uppercase tracking-wide">
                    Incomplete Documentation Provided
                  </h3>
                  <p className="text-sm text-red-800 leading-relaxed font-medium">
                    {status.rejectionReason}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Document Upload Section */}
        <div className="mb-8">
          <VerificationUpload />
        </div>

        {/* Two Column Action Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Required Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-bold text-[#043658] mb-6 flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-2">
                <FileText className="w-5 h-5 text-red-600" />
              </div>
              Why Was It Rejected?
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  The document you provided during registration did not meet our verification requirements. 
                  Please contact our support team to resubmit a valid teacher certificate.
                </p>
              </div>
            </div>
          </div>

          {/* Document Requirements */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-lg p-6 hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-bold text-[#043658] mb-6 flex items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              Document Guidelines
            </h2>
            
            <div className="space-y-3">
              {[
                "Clear and readable (not blurry)",
                "PDF, DOCX, JPG, PNG format",
                "Valid Teacher ID or Certificate",
                "Information matches registration",
              ].map((req, index) => (
                <div 
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-white rounded-lg hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 group-hover:bg-blue-200 transition-colors">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resubmit Verification CTA */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 rounded-xl p-8 shadow-lg text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-xl">
            <Upload className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-[#043658] mb-3">Ready to Resubmit?</h3>
          <p className="text-sm text-gray-700 mb-6 max-w-xl mx-auto">
            Please review the administrator's feedback above and upload your corrected verification document using the form above.
            Your verification will automatically be resubmitted for admin review after uploading.
          </p>
          <p className="mt-4 text-sm text-gray-600">
            After uploading your document, you'll be redirected to the verification pending page.
          </p>
        </div>
      </main>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
