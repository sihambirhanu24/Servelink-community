import React, { useRef, useState } from 'react';
import { useVerification } from '@/hooks/useVerification';
import { Shield, Upload, FileText, X, AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function TeacherVerificationCard() {
  const { status, documents, isLoading, uploadDocument, isUploading, deleteDocument, isDeleting, resubmit, isResubmitting } = useVerification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!status) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PDF, DOCX, JPG, and PNG are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    try {
      await uploadDocument(file, 'TEACHER_ID');
      toast.success('Document uploaded successfully.');
    } catch (err) {
      toast.error('Failed to upload document.');
    }

    e.target.value = '';
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(documentId);
      toast.success('Document deleted.');
    } catch (err) {
      toast.error('Failed to delete document.');
    }
  };

  const handleResubmit = async () => {
    if (documents.length === 0) {
      toast.error('Please upload at least one document before resubmitting.');
      return;
    }
    try {
      await resubmit();
      toast.success('Verification resubmitted successfully.');
    } catch (err) {
      toast.error('Failed to resubmit verification.');
    }
  };

  const renderStatusBanner = () => {
    switch (status.verificationStatus) {
      case 'APPROVED':
        return (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-semibold text-green-800">Verified Teacher</h4>
              <p className="text-xs text-green-700">You have full access to community features.</p>
            </div>
          </div>
        );
      case 'PENDING':
        return (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-800">Verification Pending</h4>
              <p className="text-xs text-yellow-700">Your documents are being reviewed by administrators.</p>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="text-sm font-semibold text-red-800">Verification Rejected</h4>
                <p className="text-xs text-red-700">Please review the reason below and upload a new document.</p>
              </div>
            </div>
            {status.rejectionReason && (
              <div className="rounded bg-red-100 p-2 text-xs text-red-800 border border-red-200">
                <span className="font-semibold">Reason:</span> {status.rejectionReason}
              </div>
            )}
            <button
              onClick={handleResubmit}
              disabled={isResubmitting || documents.length === 0}
              className="mt-2 w-full rounded-lg bg-red-600 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {isResubmitting ? 'Resubmitting...' : 'Resubmit Verification'}
            </button>
          </div>
        );
      default:
        return (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <AlertTriangle className="h-5 w-5 text-slate-500" />
            <div>
              <h4 className="text-sm font-semibold text-slate-700">Verification Required</h4>
              <p className="text-xs text-slate-600">Please upload your documents to verify your teacher account.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#043658]/10">
          <Shield className="h-5 w-5 text-[#043658]" />
        </div>
        <div>
          <h3 className="font-['Lexend'] font-semibold text-[#043658] text-lg">Teacher Verification</h3>
          <p className="text-xs text-slate-500">Manage your verification documents</p>
        </div>
      </div>

      {renderStatusBanner()}

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-slate-700">Verification Documents</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="group relative flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-[#043658]/30 hover:shadow-sm transition-all">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                  <FileText className="w-5 h-5 text-[#043658]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate" title={doc.fileName}>
                    {doc.fileName}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(doc.fileSize / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {status.verificationStatus !== 'APPROVED' && (
                <button
                  type="button"
                  onClick={() => handleDelete(doc.id)}
                  disabled={isDeleting}
                  className="shrink-0 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete document"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <X className="w-4 h-4" />}
                </button>
              )}
            </div>
          ))}
        </div>

        {status.verificationStatus !== 'APPROVED' && (
          <div className="mt-4">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group w-full flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-[#043658]/5 hover:border-[#043658]/50 py-8 px-4 transition-all disabled:opacity-60 disabled:hover:bg-slate-50 disabled:hover:border-slate-300"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#043658]" />
                ) : (
                  <Upload className="h-5 w-5 text-[#043658]" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-700">
                  {isUploading ? 'Uploading document...' : 'Click to upload a document'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, DOCX, JPG, PNG (Max 5MB)
                </p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
