'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, FileText, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

import AdminLayout from '@/components/admin/layout';
import {
  useApproveTeacher,
  usePendingTeachers,
  useRejectTeacher,
} from '@/hooks/useVerification';
import { getVerificationDocumentUrl } from '@/services/verification';
import type { TeacherVerification } from '@/services/verification';
import { getErrorMessage } from '@/lib/error-message';

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function DocumentList({ teacher }: { teacher: TeacherVerification }) {
  const [openingId, setOpeningId] = useState<string | null>(null);

  const openDocument = async (documentId: string) => {
    setOpeningId(documentId);
    try {
      // Documents are private: fetched with the admin token, then shown from a
      // temporary object URL instead of a public /uploads link.
      const url = await getVerificationDocumentUrl(teacher.id, documentId);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setOpeningId(null);
    }
  };

  if (teacher.verificationDocuments.length === 0) {
    return (
      <p className="text-xs text-slate-400">No documents submitted.</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {teacher.verificationDocuments.map((document) => (
        <li key={document.id} className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 shrink-0 text-[#043658]" />
          <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
            {document.documentType.replace(/_/g, ' ')} · {document.fileName} ·{' '}
            {formatSize(document.fileSize)}
          </span>
          <button
            onClick={() => openDocument(document.id)}
            disabled={openingId === document.id}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-[#043658] hover:bg-slate-50 disabled:opacity-60"
          >
            {openingId === document.id ? 'Opening…' : 'View'}
          </button>
        </li>
      ))}
    </ul>
  );
}

function PendingTeacherCard({ teacher }: { teacher: TeacherVerification }) {
  const approve = useApproveTeacher();
  const reject = useRejectTeacher();

  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const onApprove = async () => {
    try {
      await approve.mutateAsync(teacher.id);
      toast.success(`${teacher.firstName} ${teacher.lastName} approved.`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onReject = async () => {
    if (reason.trim().length < 10) {
      toast.error('Please give a rejection reason of at least 10 characters.');
      return;
    }

    try {
      await reject.mutateAsync({ teacherId: teacher.id, reason: reason.trim() });
      toast.success('Teacher rejected. They can resubmit their documents.');
      setIsRejecting(false);
      setReason('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-['Lexend'] text-sm font-semibold text-[#043658]">
            {teacher.firstName} {teacher.lastName}
          </h3>
          <p className="text-xs text-slate-500">{teacher.email}</p>
          <p className="mt-1 text-xs text-slate-500">
            {teacher.school}
            {teacher.department ? ` · ${teacher.department}` : ''}
            {teacher.teacherIdNumber ? ` · ID ${teacher.teacherIdNumber}` : ''}
          </p>
        </div>

        <span className="rounded-full border border-[#FFC107]/40 bg-[#FFC107]/15 px-2.5 py-1 text-[11px] font-semibold text-[#8a6100]">
          PENDING
        </span>
      </div>

      <div className="mt-4">
        <DocumentList teacher={teacher} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={onApprove}
          disabled={approve.isPending}
          className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 disabled:opacity-60"
        >
          {approve.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Approve
        </button>
        <button
          onClick={() => setIsRejecting((value) => !value)}
          className="rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          Reject
        </button>
      </div>

      {isRejecting && (
        <div className="mt-3">
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            placeholder="Explain what the teacher needs to correct before resubmitting."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
          />
          <button
            onClick={onReject}
            disabled={reject.isPending}
            className="mt-2 flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {reject.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm rejection
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminVerificationsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  // Debounce so typing does not fire a request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data, isLoading, error } = usePendingTeachers(
    search ? { search } : undefined,
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div>
          <h1 className="font-['Lexend'] text-xl font-semibold text-[#043658]">
            Teacher Verification
          </h1>
          <p className="text-xs text-slate-500">
            Review submitted documents and approve or reject teacher accounts.
          </p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name, email or school"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#043658]/20"
          />
        </div>

        {isLoading && (
          <p className="text-sm text-slate-500">Loading pending teachers…</p>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {getErrorMessage(error)}
          </div>
        )}

        {!isLoading && !error && data?.data.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
            No teachers are waiting for verification.
          </p>
        )}

        <div className="space-y-4">
          {data?.data.map((teacher) => (
            <PendingTeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
