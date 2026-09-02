'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { paymentsApi } from '@/services/payments';
import { Loader2, FileText, CheckCircle2, XCircle, ArrowRight, Eye } from 'lucide-react';
import Link from 'next/link';

export default function StudentPaymentsHistoryPage() {
  const { token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPayments = async () => {
      if (!token) return;
      try {
        const data = await paymentsApi.getPaymentHistory(token);
        if (isMounted) {
          setPayments(data);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchPayments();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [token, isAuthenticated, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#043658]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center text-slate-500">
        You must be logged in to view your payment history.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="font-['Lexend'] text-3xl font-bold text-[#043658]">Payment History</h1>
        <p className="text-slate-500 mt-2">Manage your purchases, receipts, and live session registrations.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">No Payments Yet</h3>
            <p className="text-slate-500 max-w-sm mt-1 mb-6">
              You haven't purchased any live sessions yet. Once you do, your receipts will appear here permanently.
            </p>
            <Link 
              href="/community?tab=live-streams" 
              className="rounded-xl bg-[#043658] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#032742]"
            >
              Browse Sessions
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {payment.liveSession?.topic || 'Unknown Session'}
                    </td>
                    <td className="px-6 py-4">
                      {payment.currency} {payment.amount}
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'SUCCESSFUL' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                        </span>
                      ) : payment.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          <XCircle className="h-3.5 w-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {payment.transactionRef}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/finance/payments/${payment.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
                      >
                        <Eye className="h-4 w-4" /> View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
