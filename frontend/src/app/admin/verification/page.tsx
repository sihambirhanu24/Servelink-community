"use client";

import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  MapPin,
  Mail,
  School,
  BookOpen,
  User,
  Download,
  Clock,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAdminVerification } from "@/hooks/useAdminVerification";
import { formatDistanceToNow } from "date-fns";

export default function AdminVerificationPage() {
  const {
    pendingTeachers,
    isLoading,
    approveTeacher,
    isApproving,
    rejectTeacher,
    isRejecting,
    viewDocument,
  } = useAdminVerification();

  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const [quickRejectReasons] = useState([
    "Incomplete or unclear documentation provided",
    "Document does not match registration information",
    "Invalid or expired teacher certificate",
    "Photo quality too low to verify identity",
    "Missing required institutional stamps or signatures",
  ]);

  const handleApprove = async (teacherId: string) => {
    try {
      await approveTeacher(teacherId);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to approve teacher");
    }
  };

  const handleRejectClick = (teacherId: string) => {
    setSelectedTeacher(teacherId);
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedTeacher || !rejectionReason.trim()) {
      alert("Please provide a rejection reason (minimum 10 characters)");
      return;
    }

    if (rejectionReason.length < 10) {
      alert("Rejection reason must be at least 10 characters");
      return;
    }

    try {
      await rejectTeacher(selectedTeacher, rejectionReason);
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedTeacher(null);
    } catch (error: any) {
      alert(error.response?.data?.message || "Failed to reject teacher");
    }
  };

  const toggleExpand = (teacherId: string) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  if (isLoading) {
    return (
      <div className="p-8 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded-lg w-1/3"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
              <div className="h-32 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Animation */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-900 bg-clip-text text-transparent">
                Teacher Verification Center
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve pending teacher registrations
              </p>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pending Reviews - Clickable */}
          <div 
            onClick={() => {
              if (pendingTeachers.length > 0 && !expandedTeacher) {
                setExpandedTeacher(pendingTeachers[0].id);
                // Scroll to first teacher
                setTimeout(() => {
                  document.getElementById(`teacher-${pendingTeachers[0].id}`)?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                  });
                }, 100);
              }
            }}
            className={`bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden ${
              pendingTeachers.length > 0 ? 'animate-pulse-border' : ''
            }`}
          >
            {/* Animated background glow for pending items */}
            {pendingTeachers.length > 0 && (
              <div className="absolute inset-0 bg-white/10 animate-pulse-slow"></div>
            )}
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1 flex items-center">
                  Pending Reviews
                  {pendingTeachers.length > 0 && (
                    <span className="ml-2 w-2 h-2 bg-white rounded-full animate-ping"></span>
                  )}
                </p>
                <p className="text-4xl font-bold">{pendingTeachers.length}</p>
                <p className="text-amber-100 text-xs mt-2 group-hover:text-white transition-colors flex items-center">
                  {pendingTeachers.length > 0 ? (
                    <>
                      Click to review 
                      <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </>
                  ) : 'All clear!'}
                </p>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all">
                <Clock className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Quick Action: Approve All */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300 cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Approved Today</p>
                <p className="text-4xl font-bold">0</p>
                <p className="text-green-100 text-xs mt-2">Great progress!</p>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ThumbsUp className="w-8 h-8" />
              </div>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-xl p-6 text-white transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium mb-1">Rejected Today</p>
                <p className="text-4xl font-bold">0</p>
                <p className="text-red-100 text-xs mt-2">Need resubmission</p>
              </div>
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ThumbsDown className="w-8 h-8" />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Teachers List */}
        {pendingTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-16 text-center animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mb-6 shadow-lg">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              All Caught Up! 🎉
            </h3>
            <p className="text-gray-600 text-lg">
              There are no pending teacher verification requests at this time.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              New registrations will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingTeachers.map((teacher, index) => (
              <div
                key={teacher.id}
                id={`teacher-${teacher.id}`}
                className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden transform hover:scale-[1.02] transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Teacher Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold">
                        {teacher.firstName[0]}{teacher.lastName[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-1">
                          {teacher.firstName} {teacher.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-blue-100 text-sm">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDistanceToNow(new Date(teacher.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span className="px-2 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-bold">
                            PENDING REVIEW
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleExpand(teacher.id)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {expandedTeacher === teacher.id ? (
                        <ChevronUp className="w-6 h-6" />
                      ) : (
                        <ChevronDown className="w-6 h-6" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Teacher Details */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Email</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{teacher.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl border border-green-200 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <School className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold">School</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{teacher.school}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-xl border border-purple-200 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                        <p className="text-sm font-medium text-gray-900">
                          {teacher.woreda}, {teacher.zone}
                        </p>
                        <p className="text-xs text-gray-500">{teacher.region}</p>
                      </div>
                    </div>

                    {teacher.department && (
                      <div className="flex items-start space-x-3 p-4 bg-amber-50 rounded-xl border border-amber-200 hover:shadow-md transition-shadow">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-500 uppercase font-semibold">Department</p>
                          <p className="text-sm font-medium text-gray-900">{teacher.department}</p>
                          {teacher.subject && (
                            <p className="text-xs text-gray-500">{teacher.subject}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Documents Section */}
                  {expandedTeacher === teacher.id && (
                    <div className="mb-6 animate-fade-in">
                      <div className="flex items-center space-x-2 mb-4">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        <h4 className="text-lg font-bold text-gray-900">
                          Uploaded Documents ({teacher.verificationDocuments.length})
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teacher.verificationDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className="group relative bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-gray-200 p-4 hover:border-blue-400 hover:shadow-lg transition-all duration-300"
                          >
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate mb-1">
                                  {doc.fileName}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    {doc.fileType.replace(/_/g, " ")}
                                  </span>
                                  <span>•</span>
                                  <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-4">
                              <button
                                onClick={() => viewDocument(teacher.id, doc.id)}
                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => viewDocument(teacher.id, doc.id)}
                                className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                              >
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleApprove(teacher.id)}
                      disabled={isApproving}
                      className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
                    >
                      <CheckCircle className="w-6 h-6" />
                      <span>{isApproving ? "Approving..." : "Approve Teacher"}</span>
                    </button>
                    <button
                      onClick={() => handleRejectClick(teacher.id)}
                      disabled={isRejecting}
                      className="flex-1 flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
                    >
                      <XCircle className="w-6 h-6" />
                      <span>{isRejecting ? "Rejecting..." : "Reject"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform animate-scale-in">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Reject Verification</h3>
                  <p className="text-sm text-gray-500">This teacher will be notified via email</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Quick Rejection Reasons
                </label>
                <div className="space-y-2">
                  {quickRejectReasons.map((reason, index) => (
                    <button
                      key={index}
                      onClick={() => setRejectionReason(reason)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        rejectionReason === reason
                          ? "border-red-500 bg-red-50 text-red-900"
                          : "border-gray-200 hover:border-red-300 text-gray-700"
                      }`}
                    >
                      <span className="text-sm font-medium">{reason}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Custom Reason (Optional)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Or type a custom rejection reason (minimum 10 characters)..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-red-200 focus:border-red-500 resize-none transition-all"
                  rows={4}
                />
                <p className="mt-2 text-xs text-gray-500">
                  {rejectionReason.length}/10 characters minimum
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={handleRejectSubmit}
                  disabled={rejectionReason.length < 10}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 disabled:scale-100"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                    setSelectedTeacher(null);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all duration-300 font-bold text-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(251, 146, 60, 0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.5s ease-out backwards;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
