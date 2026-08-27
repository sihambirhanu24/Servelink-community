'use client';

import { AlertTriangle, Clock, Lock, ExternalLink } from 'lucide-react';
import { useSuspensionStatus } from '@/hooks/useSuspensionStatus';
import { useAuth } from '@/context/AuthContext';

export default function SuspensionBanner() {
  const { user } = useAuth();
  const teacherId = user?.id; // User.id is the teacher ID for teacher accounts
  const { suspensionStatus, loading } = useSuspensionStatus(teacherId);

  if (loading || !suspensionStatus || !suspensionStatus.isSuspended) {
    return null;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Permanent';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getDaysRemaining = () => {
    if (!suspensionStatus.suspensionUntil) return 'Permanent';
    if (suspensionStatus.remainingDays === 0) return 'Expired';
    return `${suspensionStatus.remainingDays} day${suspensionStatus.remainingDays !== 1 ? 's' : ''}`;
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            Account Suspended
          </h3>
          <p className="text-sm text-red-700 mb-2">
            Your account was suspended because of: <strong>{suspensionStatus.suspensionReason || 'Policy violation'}</strong>
          </p>
          <div className="text-xs text-red-600 space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Suspended on: {formatDate(suspensionStatus.suspensionStart)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="h-3 w-3" />
              <span>
                {suspensionStatus.status === 'PERMANENTLY_SUSPENDED' 
                  ? 'Status: Permanent suspension'
                  : `Suspension ends: ${formatDate(suspensionStatus.suspensionUntil)} (${getDaysRemaining()} remaining)`
                }
              </span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <a
              href="/suspended"
              className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 underline"
            >
              View Suspension Details
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
