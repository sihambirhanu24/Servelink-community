"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { paymentsApi } from "@/services/payments";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const router = useRouter();
  const { token } = useAuth();

  useEffect(() => {
    let isMounted = true;
    
    const verifyAndRedirect = async () => {
      if (!txRef) {
        if (isMounted) {
          toast.error("Invalid payment redirect. No transaction reference found.");
          router.replace("/community?tab=live-streams");
        }
        return;
      }
      
      if (!token) return;

      try {
        const res = await paymentsApi.verifyPayment({ transactionRef: txRef }, token);
        if (isMounted) {
          if (res.status === 'SUCCESSFUL' || res.message === 'Payment already verified') {
            toast.success("Payment verified successfully!");
          } else {
            toast.error("Payment verification failed.");
          }
          if (res.liveSessionId) {
             // Pass tx_ref so the details page can also see it, though it's already verified
             router.replace(`/live-sessions/${res.liveSessionId}?tx_ref=${txRef}`);
          } else {
             router.replace("/community?tab=live-streams");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          toast.error(err.response?.data?.message || "Failed to verify payment status");
          router.replace("/community?tab=live-streams");
        }
      }
    };

    verifyAndRedirect();

    return () => { isMounted = false; };
  }, [txRef, token, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center flex-col gap-4 bg-slate-50">
      <Loader2 className="h-10 w-10 animate-spin text-[#043658]" />
      <p className="text-lg font-medium text-slate-600">Verifying your payment with Chapa...</p>
    </div>
  );
}
