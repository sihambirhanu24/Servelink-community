import { useState, useEffect } from 'react';
import { api } from '@/lib/axios';

export interface SuspensionStatus {
  isSuspended: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'PERMANENTLY_SUSPENDED';
  suspensionReason: string | null;
  suspensionStart: string | null;
  suspensionUntil: string | null;
  suspendedBy: string | null;
  suspensionCount: number;
  remainingDays?: number;
  isExpired?: boolean;
}

export function useSuspensionStatus(teacherId?: string) {
  const [suspensionStatus, setSuspensionStatus] = useState<SuspensionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teacherId) {
      setLoading(false);
      return;
    }

    fetchSuspensionStatus();
  }, [teacherId]);

  const fetchSuspensionStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/suspension/${teacherId}/status`);
      const data = response.data;

      // Calculate remaining days if applicable
      let remainingDays = undefined;
      if (data.suspensionUntil && data.status === 'SUSPENDED') {
        const now = new Date();
        const until = new Date(data.suspensionUntil);
        const diffTime = until.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        remainingDays = diffDays > 0 ? diffDays : 0;
      }

      setSuspensionStatus({
        isSuspended: data.status !== 'ACTIVE',
        status: data.status,
        suspensionReason: data.suspensionReason,
        suspensionStart: data.suspensionStart,
        suspensionUntil: data.suspensionUntil,
        suspendedBy: data.suspendedBy,
        suspensionCount: data.suspensionCount || 0,
        remainingDays,
        isExpired: remainingDays === 0,
      });
    } catch (err: any) {
      // If 404 or error, assume not suspended
      setSuspensionStatus({
        isSuspended: false,
        status: 'ACTIVE',
        suspensionReason: null,
        suspensionStart: null,
        suspensionUntil: null,
        suspendedBy: null,
        suspensionCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (teacherId) {
      fetchSuspensionStatus();
    }
  };

  return {
    suspensionStatus,
    loading,
    error,
    refresh,
  };
}
