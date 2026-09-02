'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLiveSession, useUpdateLiveSessionStatus } from '@/services/live-sessions';
import { paymentsApi } from '@/services/payments';
import { Avatar } from '@/components/common/Avatar';
import { Loader2, AlertTriangle, ArrowLeft, Calendar, Users, Clock, CheckCircle2, Video, CreditCard, Lock, Bell, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { api } from '@/lib/axios';
import { useSessionStatus } from '@/hooks/useSessionStatus';

export default function LiveSessionDetailsPage() {
  const { id } = useParams() as { id: string };
  const searchParams = useSearchParams();
  const txRef = searchParams.get('tx_ref');
  const isAdmin = searchParams.get('role') === 'admin';
  const router = useRouter();
  const { user, token } = useAuth();
  
  const { data: session, isLoading: isLoadingSession, error: sessionError, refetch } = useLiveSession(id, isAdmin);
  const updateStatusMutation = useUpdateLiveSessionStatus(isAdmin);
  const [isVerifyingPayment] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSettingReminder, setIsSettingReminder] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  const { status: realTimeStatus, countdown } = useSessionStatus(session);

  // Payment verification is now handled by the dedicated /payments/chapa/result page.
  // The user will return to this page after verification is complete.

  const handleRemind = async () => {
    setIsSettingReminder(true);
    try {
      await api.post(`/live-sessions/${id}/remind`);
      toast.success("Reminder set! You will be notified before the session starts.");
      setReminderSet(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to set reminder.");
    } finally {
      setIsSettingReminder(false);
    }
  };

  const handleRegisterAndPay = async () => {
    if (!token) {
      toast.error("You must be logged in to register.");
      return;
    }
    if (!session?.price) return;
    
    setIsProcessingPayment(true);
    try {
      const res = await paymentsApi.createPayment({
        liveSessionId: id,
        amount: Number(session.price),
        paymentMethod: 'TELEBIRR',
        email: user?.email,
        firstName: user?.firstName,
        lastName: user?.lastName,
      }, token);

      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        toast.error("Could not initiate payment. No checkout URL returned.");
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initialize payment.");
      setIsProcessingPayment(false);
    }
  };



  const handleJoinRestream = () => {
    if (session?.restreamPlayerUrl) {
      window.open(session.restreamPlayerUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No Restream URL configured for this session.');
    }
  };

  if (isLoadingSession || isVerifyingPayment) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#043658]" />
        <p className="text-sm font-medium text-slate-500">
          {isVerifyingPayment ? "Verifying your payment..." : "Loading session details..."}
        </p>
      </div>
    );
  }

  if (sessionError || !session) {
    const errorMessage = (sessionError as any)?.response?.data?.message || 'Unable to load this live session.';
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h2 className="mb-2 font-['Lexend'] text-xl font-bold text-[#043658]">Cannot Load Session</h2>
          <p className="mb-6 text-sm text-slate-500">{errorMessage}</p>
          <button 
            onClick={() => router.back()} 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  const isTeacher = user?.id === session.teacherId;
  const access = (session as any).access;
  const canAccess = access?.canAccess || false;
  const isPaidAndLocked = session.isPaid && !canAccess && !isTeacher && !isAdmin;
  const isRegistered = access?.registrationStatus?.startsWith('REGISTERED');
  const paymentStatus = access?.paymentStatus || null;
  
  const isLive = realTimeStatus === 'LIVE';
  const isEnded = realTimeStatus === 'ENDED';
  const isScheduled = realTimeStatus === 'UPCOMING';
  const price = session.isPaid && session.price ? Number(session.price) : 0;

  // Render the primary CTA intelligently
  const renderActionCTA = () => {
    // HOST/ADMIN CONTROLS
    if (isTeacher || isAdmin) {
      if (!session.restreamPlayerUrl) {
        return (
          <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
            Configure Restream URL
          </button>
        );
      }

      if (isScheduled || isLive) {
        return (
          <button 
            onClick={handleJoinRestream} 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-4 py-4 text-sm font-bold text-[#043658] shadow-sm transition-all hover:bg-[#ffcd38]"
          >
            <Video className="h-5 w-5" /> 🎥 Open Restream
          </button>
        );
      }

      return (
        <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
          ✓ Session Ended
        </button>
      );
    }

    // USER REGISTRATION & ACCESS
    if (isPaidAndLocked) {
      if (paymentStatus === 'PENDING') {
        return (
          <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-600 shadow-sm opacity-70">
            <Loader2 className="h-5 w-5 animate-spin" />
            ⏳ Payment Pending
          </button>
        );
      }
      return (
        <button
          onClick={handleRegisterAndPay}
          disabled={isProcessingPayment}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFC107] px-4 py-4 text-sm font-bold text-[#043658] shadow-sm transition-all hover:bg-[#ffcd38] hover:-translate-y-0.5"
        >
          {isProcessingPayment ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          Register & Pay ETB {price}
        </button>
      );
    }

    // USER HAS ACCESS
    if (!session.restreamPlayerUrl) {
      return (
        <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-500 shadow-sm text-center leading-tight">
          Live session link is not configured yet.
        </button>
      );
    }

    if (isEnded) {
      return (
        <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
          ✓ Session Ended
        </button>
      );
    }

    if (isLive) {
      return (
        <button
          onClick={handleJoinRestream}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-red-600 hover:-translate-y-0.5 animate-pulse"
        >
          🔴 Join Live Session
        </button>
      );
    }

    // UPCOMING
    return (
      <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-4 text-sm font-bold text-slate-500 shadow-sm">
        ⏳ Starts in {countdown || '...'}
      </button>
    );
  };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* ── BACK BUTTON ── */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#043658] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Sessions
      </button>

      {/* ── HERO BANNER ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#043658] to-[#0a4a75] shadow-xl">
        {/* Abstract Background Decoration */}
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 right-40 h-40 w-40 rounded-full bg-[#FFC107]/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center p-8 md:p-12 gap-8">
          <div className="flex-1 text-white">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {isLive ? (
                <span className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-1.5 text-xs font-bold tracking-widest text-red-100 ring-1 ring-red-500/40">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  LIVE NOW
                </span>
              ) : isScheduled ? (
                <span className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold tracking-widest text-white ring-1 ring-white/20 backdrop-blur-sm">
                  <Calendar className="h-3.5 w-3.5" /> UPCOMING
                </span>
              ) : (
                <span className="flex items-center gap-2 rounded-full bg-slate-500/30 px-4 py-1.5 text-xs font-bold tracking-widest text-slate-200 ring-1 ring-slate-400/40">
                  <CheckCircle2 className="h-3.5 w-3.5" /> SESSION ENDED
                </span>
              )}
              <span
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide backdrop-blur-sm ${
                  price > 0 ? "bg-[#FFC107]/20 text-[#FFC107] ring-1 ring-[#FFC107]/30" : "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                }`}
              >
                {price > 0 ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                {price > 0 ? `ETB ${price}` : "FREE"}
              </span>
            </div>
            
            <h1 className="font-['Lexend'] text-3xl font-extrabold sm:text-4xl md:text-5xl leading-tight mb-6">
              {session.topic}
            </h1>
            
            <div className="flex items-center gap-4">
              <Avatar
                profileImage={session.teacher?.profileImage}
                name={`${session.teacher?.firstName || 'Unknown'} ${session.teacher?.lastName || ''}`.trim()}
                size="lg"
                className="border-2 border-white/20 shadow-md"
              />
              <div>
                <p className="text-sm font-medium text-slate-300">Hosted by</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold text-white">
                    {session.teacher?.firstName} {session.teacher?.lastName}
                  </p>
                  <CheckCircle2 className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Action Card */}
          <div className="w-full md:w-80 shrink-0 rounded-2xl bg-white/10 p-6 backdrop-blur-md ring-1 ring-white/20 shadow-lg text-center">
            {isScheduled && countdown ? (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-300 uppercase tracking-widest mb-2">Starts in</p>
                <p className="font-mono text-3xl font-bold text-white tracking-widest">{countdown}</p>
              </div>
            ) : isEnded ? (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-300 uppercase tracking-widest mb-2">Ended at</p>
                <p className="text-xl font-bold text-white">{new Date(new Date(session.scheduledStart).getTime() + (session.duration * 60000)).toLocaleTimeString()}</p>
              </div>
            ) : null}

            {renderActionCTA()}
          </div>
        </div>
      </div>



      {/* ── MAIN CONTENT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Description & Expectations */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Access Status Card */}
          {!isTeacher && !isAdmin && (
            <div className={`flex items-start gap-4 rounded-2xl p-6 border ${
              isPaidAndLocked ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200"
            }`}>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                isPaidAndLocked ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
              }`}>
                {isPaidAndLocked ? <Lock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
              </div>
              <div>
                <h3 className={`font-['Lexend'] text-lg font-bold mb-1 ${
                  isPaidAndLocked ? "text-amber-800" : "text-emerald-800"
                }`}>
                  {isPaidAndLocked ? "Registration Required" : "Access Granted"}
                </h3>
                <p className={`text-sm ${isPaidAndLocked ? "text-amber-700/80" : "text-emerald-700/80"}`}>
                  {isPaidAndLocked 
                    ? "You must complete registration and payment to access this live session."
                    : "You are registered and have full access to this live session."}
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Info className="h-6 w-6 text-[#043658]" />
              <h3 className="font-['Lexend'] text-xl font-bold text-[#043658]">What to Expect</h3>
            </div>
            
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap">
              {session.description || "Join this interactive live session to learn and engage with the instructor. Prepare your questions for the live Q&A segment!"}
            </div>
            
            {!session.description && (
               <ul className="mt-6 space-y-3 text-slate-600">
                 <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Interactive teaching strategies</li>
                 <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Practical, real-world examples</li>
                 <li className="flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Live Q&A and community discussion</li>
               </ul>
            )}
          </div>
        </div>

        {/* Right Column: Session Details Card */}
        <div className="space-y-6">
          <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h3 className="mb-6 font-['Lexend'] text-xl font-bold text-[#043658]">Session Details</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#043658]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Date</p>
                  <p className="mt-1 text-base font-semibold text-slate-700">{new Date(session.scheduledStart).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#043658]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Time & Duration</p>
                  <p className="mt-1 text-base font-semibold text-slate-700">
                    {new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                    {' '}–{' '}
                    {new Date(new Date(session.scheduledStart).getTime() + session.duration * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-slate-500">{session.duration} minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#043658]">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Capacity</p>
                  <p className="mt-1 text-base font-semibold text-slate-700">
                    {(session as any).maxParticipants ? `Up to ${(session as any).maxParticipants} seats` : 'Unlimited seats'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
