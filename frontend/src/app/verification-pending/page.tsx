'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hourglass, FileText } from 'lucide-react';
import { useVerification } from '@/hooks/useVerification';

export default function VerificationPendingPage() {
  const router = useRouter();
  const { status, isLoading } = useVerification();
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const teacherData = localStorage.getItem('teacher');
      if (teacherData) {
        try {
          setTeacher(JSON.parse(teacherData));
        } catch (e) {
          // ignore
        }
      }
    }
  }, []);

  // Redirect if approved or rejected
  useEffect(() => {
    if (status?.verificationStatus === 'APPROVED') {
      router.push('/dashboard');
    }
    // If rejected, could either stay here (and show rejected UI) or push to profile
    // But since this page is specifically 'Pending', let's push them to profile to upload again
    if (status?.verificationStatus === 'REJECTED') {
      router.push('/profile');
    }
  }, [status, router]);

  if (isLoading || !teacher) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#043658] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Get the most recent document
  const recentDoc = status?.documents?.[0];
  const submissionDate = recentDoc?.uploadedAt 
    ? new Date(recentDoc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl flex flex-col items-center text-center">
        
        {/* Golden Hourglass Icon */}
        <div className="w-20 h-20 bg-[#FDF9F0] rounded-full flex items-center justify-center mb-6">
          <Hourglass className="w-10 h-10 text-[#C19B45]" />
        </div>

        {/* Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#E5DAC1] bg-[#FDF9F0] mb-6">
          <div className="w-2 h-2 rounded-full bg-[#C19B45]"></div>
          <span className="text-[10px] font-bold text-[#8A6A23] uppercase tracking-wider">
            Pending Review
          </span>
        </div>

        {/* Title & Subtitle */}
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Verification Under Review
        </h1>
        <p className="text-slate-600 text-[15px] max-w-lg mb-10 leading-relaxed">
          Your teacher information has been submitted and is currently being reviewed by an administrator. This process usually takes 1-2 business days.
        </p>

        {/* Submission Details Card */}
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8 text-left mb-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-semibold text-slate-800 text-lg">Submission Details</h3>
            <span className="text-sm font-medium text-slate-500">{submissionDate}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
            <div>
              <p className="text-xs text-slate-500 mb-1">Document Type</p>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <p className="text-sm font-semibold text-slate-800">
                  {recentDoc ? recentDoc.fileName : 'Teacher Verification Document'}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Institution</p>
              <p className="text-sm font-semibold text-slate-800">
                {teacher.school || 'Unknown Institution'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Submitted By</p>
              <p className="text-sm font-semibold text-slate-800">
                {teacher.firstName} {teacher.lastName}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-1">Reference Number</p>
              <p className="text-sm font-semibold text-slate-800 font-mono">
                VRF-{teacher.id ? teacher.id.substring(0, 8).toUpperCase() : 'UNKNOWN'}
              </p>
            </div>
          </div>
        </div>

        {/* View Dashboard Button */}
        <button
          onClick={() => router.push('/dashboard')}
          className="px-8 py-3 bg-[#043658] text-white font-medium rounded-lg hover:bg-[#043658]/90 transition-colors shadow-sm"
        >
          View Dashboard
        </button>

      </div>
    </div>
  );
}
