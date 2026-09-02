'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paymentsApi } from '@/services/payments';
import { CheckCircle2, XCircle, Loader2, FileText, ArrowRight, Video } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function ChapaPaymentResultPage() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const router = useRouter();
  const { token, isLoading: authLoading } = useAuth();
  
  const [status, setStatus] = useState<'PENDING' | 'SUCCESS' | 'FAILED'>('PENDING');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyPayment = async () => {
      if (!txRef) {
        if (isMounted) {
          setStatus('FAILED');
          setErrorMessage('No transaction reference found. Invalid redirect.');
        }
        return;
      }

      if (authLoading) return;

      if (!token) {
        if (isMounted) {
          setStatus('FAILED');
          setErrorMessage('You must be logged in to verify payment.');
        }
        return;
      }

      try {
        const response = await paymentsApi.verifyPayment({ transactionRef: txRef }, token);
        
        if (isMounted) {
          if (response.status === 'SUCCESSFUL') {
            setStatus('SUCCESS');
            setPaymentData(response);
          } else {
            setStatus('FAILED');
            setErrorMessage(response.message || 'Payment failed.');
          }
        }
      } catch (error: any) {
        if (isMounted) {
          setStatus('FAILED');
          setErrorMessage(error.response?.data?.message || error.message || 'Payment verification failed due to a server error.');
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [txRef, token, authLoading]);

  if (status === 'PENDING') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-[#043658] mb-6" />
        <h1 className="text-2xl font-bold font-['Lexend'] text-[#043658] mb-2">Verifying Payment...</h1>
        <p className="text-slate-500 max-w-sm">Please wait while we confirm your transaction securely with Chapa. Do not close this window.</p>
      </div>
    );
  }

  if (status === 'FAILED') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 p-8 rounded-3xl border border-red-100 max-w-md w-full shadow-sm">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold font-['Lexend'] text-red-700 mb-2">Payment Failed</h1>
          <p className="text-red-500/80 mb-8">{errorMessage}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => router.back()} variant="primary" className="w-full">
              Go Back & Try Again
            </Button>
            <Link href="/community?tab=live-streams">
              <Button variant="outline" className="w-full">
                Browse Other Sessions
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Success Header */}
        <div className="bg-emerald-500 p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
          <CheckCircle2 className="h-16 w-16 text-white mx-auto mb-4 relative z-10" />
          <h1 className="text-3xl font-bold font-['Lexend'] relative z-10">Payment Successful!</h1>
          <p className="text-emerald-100 font-medium mt-2 relative z-10">Your registration is complete.</p>
        </div>

        {/* Receipt Details */}
        <div className="p-8">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Payment Status</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-sm">PAID</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Amount</span>
              <span className="font-bold text-[#043658]">ETB {paymentData?.amount || '---'}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Date</span>
              <span className="font-semibold text-slate-700">
                {paymentData?.verifiedAt ? new Date(paymentData.verifiedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Transaction Ref</span>
              <span className="font-mono text-sm text-slate-700">{txRef}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Chapa Receipt ID</span>
              <span className="font-mono text-sm text-slate-700">{paymentData?.chapaReference || '---'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {paymentData?.chapaReference && (
              <a 
                href={`https://chapa.link/payment-receipt/${paymentData.chapaReference}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-4 text-sm font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-200"
              >
                <FileText className="h-5 w-5" /> View Official Receipt
              </a>
            )}
            
            {paymentData?.liveSessionId && (
              <Link href={`/live-sessions/${paymentData.liveSessionId}`} className="block">
                <Button variant="primary" className="w-full py-4 text-sm flex items-center justify-center gap-2">
                  <Video className="h-5 w-5" /> Go to Live Session
                </Button>
              </Link>
            )}

            <Link href="/finance/payments" className="block text-center mt-6">
              <span className="text-sm font-semibold text-[#043658] hover:underline flex items-center justify-center gap-1">
                View My Payment History <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
