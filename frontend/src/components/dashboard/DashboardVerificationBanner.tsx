import Link from 'next/link';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Props {
  status: string;
  rejectionReason?: string | null;
}

export function DashboardVerificationBanner({ status, rejectionReason }: Props) {
  if (status === 'APPROVED') {
    return (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-start sm:items-center gap-3">
          <CheckCircle className="mt-0.5 sm:mt-0 h-5 w-5 text-green-600 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-green-800">Verified Teacher</h3>
            <p className="mt-1 text-xs text-green-700">
              Your teacher account is verified. You can now participate in the community.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'PENDING') {
    return (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex items-start sm:items-center gap-3">
          <Clock className="mt-0.5 sm:mt-0 h-5 w-5 text-yellow-600 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">Verification Pending</h3>
            <p className="mt-1 text-xs text-yellow-700">
              Your teacher account is being reviewed. You can explore the community while your verification is being processed.
            </p>
          </div>
        </div>
        <Link
          href="/verification-pending"
          className="shrink-0 rounded-lg bg-yellow-100 px-4 py-2 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 transition-colors text-center"
        >
          View Status
        </Link>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600 shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Verification Needs Attention</h3>
            <p className="mt-1 text-xs text-red-700">
              Your previous verification submission was rejected.
            </p>
            {rejectionReason && (
              <p className="mt-2 text-xs text-red-800 bg-red-100 p-2 rounded border border-red-200">
                <span className="font-semibold">Reason:</span> {rejectionReason}
              </p>
            )}
          </div>
        </div>
        <Link
          href="/verification-setup"
          className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors text-center"
        >
          Update Verification
        </Link>
      </div>
    );
  }

  // Default: not verified
  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start sm:items-center gap-3">
        <AlertTriangle className="mt-0.5 sm:mt-0 h-5 w-5 text-blue-600 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-blue-800">Teacher Verification Required</h3>
          <p className="mt-1 text-xs text-blue-700">
            Complete your teacher verification to access all community features, create posts, and earn progression points.
          </p>
        </div>
      </div>
      <Link
        href="/verification-setup"
        className="shrink-0 rounded-lg bg-[#043658] px-4 py-2 text-xs font-semibold text-white hover:bg-[#043658]/90 transition-colors text-center"
      >
        Get Verified
      </Link>
    </div>
  );
}
