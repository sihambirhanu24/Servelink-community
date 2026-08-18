"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Clock,
  Shield,
  School,
  User,
  BookOpen,
  FileText,
  AlertCircle,
  LogOut,
  Lock,
  Mail,
  MapPin,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useVerification } from "@/hooks/useVerification";
import VerificationRejected from "@/components/verification/VerificationRejected";

export default function VerificationPendingPage() {
  const router = useRouter();
  const { status, isLoading } = useVerification();
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  // Redirect if approved
  useEffect(() => {
    if (status?.verificationStatus === "APPROVED") {
      router.push("/dashboard");
    }
  }, [status, router]);

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

  // Show rejected state if verification was rejected
  if (status?.verificationStatus === "REJECTED") {
    return <VerificationRejected />;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("teacher");
    router.push("/auth/login");
  };

  const statusSteps = [
    { 
      id: 1, 
      label: "Account Created", 
      completed: true,
      icon: CheckCircle,
      description: "Your account has been successfully created"
    },
    { 
      id: 2, 
      label: "Info Submitted", 
      completed: true,
      icon: CheckCircle,
      description: "Teacher information submitted"
    },
    { 
      id: 3, 
      label: "Docs Uploaded", 
      completed: status?.documents && status.documents.length > 0,
      icon: status?.documents && status.documents.length > 0 ? CheckCircle : Clock,
      description: status?.documents && status.documents.length > 0 
        ? `${status.documents.length} document${status.documents.length !== 1 ? 's' : ''} uploaded`
        : "Documents pending"
    },
    { 
      id: 4, 
      label: "Admin Review", 
      completed: false,
      current: true,
      icon: Clock,
      description: "Administrator is reviewing your information"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F9FC] via-white to-blue-50">
      {/* Animated Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#043658] to-[#0A5C8F] rounded-lg flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <span className="text-white font-bold text-lg">SL</span>
              </div>
              <div>
                <span className="font-bold text-[#043658] text-xl">ServeLink</span>
                <p className="text-xs text-gray-500">Teacher Verification Portal</p>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section with Animation */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-2xl mb-4 shadow-lg animate-bounce-slow">
            <Shield className="w-10 h-10 text-[#043658]" />
          </div>
          <h1 className="text-4xl font-bold text-[#043658] mb-3 bg-gradient-to-r from-[#043658] to-[#0A5C8F] bg-clip-text text-transparent">
            Verification in Progress
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your educator account is being reviewed by our administrators. This usually takes 1-2 business days.
          </p>
          
          {/* Live Status Badge */}
          <div className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-gradient-to-r from-[#FFF9E6] to-[#FFE082] border-2 border-[#FFC107] rounded-full shadow-md">
            <div className="w-2 h-2 bg-[#FFC107] rounded-full animate-pulse"></div>
            <Clock className="w-4 h-4 text-[#043658]" />
            <span className="text-sm font-bold text-[#043658]">Review in Progress</span>
          </div>
        </div>

        {/* Interactive Status Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-8 mb-8 overflow-hidden relative">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-transparent rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-50 to-transparent rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative">
            <h2 className="text-2xl font-bold text-[#043658] mb-8 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-[#FFC107]" />
              Verification Timeline
            </h2>
            
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-0 right-0 top-10 h-1 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200" style={{ marginLeft: '40px', marginRight: '40px' }}>
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-green-500 to-[#FFC107] transition-all duration-1000 ease-out"
                  style={{ width: '75%' }}
                ></div>
              </div>

              {/* Status Steps */}
              <div className="flex items-start justify-between relative z-10">
                {statusSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div 
                      key={step.id}
                      className="flex flex-col items-center flex-1 cursor-pointer group"
                      onMouseEnter={() => setHoveredStep(index)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      <div 
                        className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 transform ${
                          step.completed
                            ? "bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 group-hover:shadow-xl"
                            : step.current
                            ? "bg-gradient-to-br from-[#FFC107] to-[#FFD54F] shadow-lg group-hover:scale-110 group-hover:shadow-xl animate-pulse"
                            : "bg-gray-100 border-2 border-gray-300 group-hover:border-gray-400"
                        }`}
                      >
                        <Icon className={`w-10 h-10 ${
                          step.completed || step.current ? "text-white" : "text-gray-400"
                        }`} />
                      </div>
                      <p className={`text-sm font-bold text-center mb-1 transition-colors ${
                        step.completed
                          ? "text-green-600"
                          : step.current
                          ? "text-[#043658]"
                          : "text-gray-400"
                      }`}>
                        {step.label}
                      </p>
                      <p className={`text-xs text-center transition-all duration-300 ${
                        hoveredStep === index ? "text-gray-700 font-medium" : "text-gray-500"
                      }`}>
                        {step.completed && !step.current ? "Completed ✓" : step.current ? "In Progress..." : "Pending"}
                      </p>
                      
                      {/* Tooltip on hover */}
                      {hoveredStep === index && (
                        <div className="absolute top-24 mt-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-20 animate-fade-in max-w-xs text-center">
                          {step.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Submitted Details - Expandable */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
            <div 
              className="p-6 bg-gradient-to-br from-blue-50 to-white cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-[#043658]">Your Details</h3>
                </div>
                <ArrowRight className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showDetails ? 'rotate-90' : ''}`} />
              </div>

              {teacher && showDetails && (
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white transition-colors">
                    <User className="w-4 h-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Full Name</p>
                      <p className="text-sm font-bold text-[#043658]">
                        {teacher.firstName} {teacher.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white transition-colors">
                    <Mail className="w-4 h-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</p>
                      <p className="text-sm font-bold text-[#043658] break-all">{teacher.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white transition-colors">
                    <School className="w-4 h-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Institution</p>
                      <p className="text-sm font-bold text-[#043658]">{teacher.school}</p>
                    </div>
                  </div>

                  {teacher.department && (
                    <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white transition-colors">
                      <BookOpen className="w-4 h-4 text-blue-600 mt-1" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Department</p>
                        <p className="text-sm font-bold text-[#043658]">{teacher.department}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3 p-2 rounded-lg hover:bg-white transition-colors">
                    <MapPin className="w-4 h-4 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Location</p>
                      <p className="text-sm font-bold text-[#043658]">{teacher.woreda}, {teacher.zone}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps - Animated */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-[#FFC107] shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-5 h-5 text-[#043658]" />
              </div>
              <h3 className="text-lg font-bold text-[#043658]">What's Next?</h3>
            </div>

            <div className="space-y-4">
              {[
                { num: 1, text: "Regional admin verifies credentials", delay: "delay-100" },
                { num: 2, text: "Department alignment confirmed", delay: "delay-200" },
                { num: 3, text: "Approval email with access link", delay: "delay-300" },
              ].map((step) => (
                <div 
                  key={step.num}
                  className={`flex items-start space-x-3 p-3 bg-white/70 rounded-lg hover:bg-white hover:shadow-md transition-all duration-300 cursor-pointer animate-slide-in-left ${step.delay}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#FFC107] to-[#FFD54F] rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-[#043658]">{step.num}</span>
                  </div>
                  <p className="text-sm text-gray-700 pt-1">{step.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Security Info - Interactive */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-[#043658]">Secure & Private</h3>
            </div>

            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 shadow-lg group-hover:scale-110 transition-transform">
                <Lock className="w-12 h-12 text-green-600" />
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-4">
                Your documents are encrypted and stored securely following Ministry of Education compliance standards.
              </p>
              <div className="flex items-center justify-center space-x-2 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full">
                <CheckCircle className="w-4 h-4" />
                <span className="font-semibold">256-bit Encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Missing Documents Alert - Interactive */}
        {(!status?.documents || status.documents.length === 0) && (
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-l-4 border-amber-500 rounded-xl p-6 shadow-lg mb-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  Teacher Certificate Pending
                </h3>
                <p className="text-sm text-amber-800">
                  We're waiting for your teacher certificate upload. This is required to complete your verification process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="text-center bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <p className="text-sm text-gray-600 mb-2">
            Your verification is being processed by our administrative team.
          </p>
          <p className="text-xs text-gray-500">
            You'll receive an email notification once your account is approved. Typical review time is 1-2 business days.
          </p>
        </div>
      </main>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  );
}
