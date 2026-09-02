'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paymentsApi } from '@/services/payments';
import { CheckCircle2, XCircle, Loader2, FileText, ArrowLeft, Video, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function PaymentDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  
  const [payment, setPayment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPaymentDetails = async () => {
      if (!token) return;
      try {
        const data = await paymentsApi.getPaymentById(id, token);
        if (isMounted) {
          setPayment(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load payment details.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchPaymentDetails();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }

    return () => { isMounted = false; };
  }, [id, token, isAuthenticated, authLoading]);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#043658]" />
      </div>
    );
  }

  if (!isAuthenticated || error) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
        <XCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cannot Load Receipt</h2>
        <p className="text-slate-500">{error || 'You must be logged in to view this receipt.'}</p>
        <button 
          onClick={() => router.back()}
          className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#043658] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </button>
      </div>
    );
  }

  const isSuccess = payment.status === 'SUCCESSFUL';

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      
      <button 
        onClick={() => router.push('/finance/payments')}
        className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#043658] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Payments
      </button>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
        
        {/* Header */}
        <div className={`p-8 text-white relative ${isSuccess ? 'bg-emerald-500' : payment.status === 'PENDING' ? 'bg-amber-500' : 'bg-red-500'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
              {isSuccess ? <CheckCircle2 className="h-8 w-8" /> : payment.status === 'PENDING' ? <Loader2 className="h-8 w-8 animate-spin" /> : <XCircle className="h-8 w-8" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Lexend']">
                {isSuccess ? 'Payment Successful' : payment.status === 'PENDING' ? 'Payment Pending' : 'Payment Failed'}
              </h1>
              <p className="text-white/80 font-medium text-sm mt-1">
                {new Date(payment.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Session</p>
                <p className="font-semibold text-slate-800">{payment.liveSession?.topic || 'Unknown Session'}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> Payment Method</p>
                <p className="font-semibold text-slate-800">{payment.paymentMethod}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Transaction Ref</p>
                <p className="font-mono text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">{payment.transactionRef}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Amount Paid</p>
                <p className="text-2xl font-bold text-[#043658]">{payment.currency} {payment.amount}</p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Chapa Reference</p>
                {payment.chapaTxRef ? (
                  <p className="font-mono text-sm text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">{payment.chapaTxRef}</p>
                ) : (
                  <p className="text-sm font-medium text-slate-400">Not Available</p>
                )}
              </div>
              
              {payment.failureReason && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 text-red-500">Failure Reason</p>
                  <p className="text-sm font-medium text-red-600">{payment.failureReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4 justify-end">
            {isSuccess && payment.chapaTxRef && (
              <a 
                href={`https://chapa.link/payment-receipt/${payment.chapaTxRef}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-200"
              >
                <FileText className="h-5 w-5" /> View Official Receipt
              </a>
            )}
            
            {isSuccess && payment.liveSessionId && (
              <Link href={`/live-sessions/${payment.liveSessionId}`}>
                <Button variant="primary" className="w-full sm:w-auto px-8 py-3.5 text-sm flex items-center justify-center gap-2">
                  <Video className="h-5 w-5" /> Go to Live Session
                </Button>
              </Link>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
