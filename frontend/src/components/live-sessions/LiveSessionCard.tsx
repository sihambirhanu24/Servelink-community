import React from "react";
import { Users, Clock, Video, Lock, Unlock, PlayCircle, Calendar, CheckCircle2 } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { formatDistanceToNow, format } from "date-fns";
import { useSessionStatus } from "@/hooks/useSessionStatus";

export interface Session {
  id: string;
  topic: string;
  description: string | null;
  scheduledStart: string;
  duration: number;
  status: string;
  price: string | number | null;
  isPaid: boolean;
  visibility: string;
  maxParticipants?: number;
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    isVerified?: boolean;
  };
  hostActions?: {
    canDelete: boolean;
    canCancel: boolean;
    isCancelled: boolean;
    paidParticipants: number;
    totalCollected: number;
  };
}

interface LiveSessionCardProps {
  session: Session;
  onJoin?: () => void;
  onRemind?: () => void;
  onRegister?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  isOwner?: boolean;
}

export function LiveSessionCard({
  session,
  onJoin,
  onRemind,
  onRegister,
  onEdit,
  onCancel,
  onDelete,
  isOwner,
}: LiveSessionCardProps) {
  const { status: realTimeStatus } = useSessionStatus(session);
  
  const isLive = realTimeStatus === 'LIVE';
  const isUpcoming = realTimeStatus === 'UPCOMING';
  const isEnded = realTimeStatus === 'ENDED';
  const isCancelled = session.status === 'CANCELLED' || session.hostActions?.isCancelled;
  
  // For admin/teacher actions, still use stored status for certain states
  const isRequested = session.status === 'REQUESTED';
  const isApproved = session.status === 'APPROVED';
  const isCompleted = session.status === 'COMPLETED';

  const price = session.isPaid && session.price ? Number(session.price) : 0;

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgb(0,0,0,0.02)] transition-all hover:border-[#FFC107]/50 hover:shadow-md">
      {/* Top Banner / Status */}
      <div className="relative h-16 w-full bg-gradient-to-r from-[#043658] to-[#0a4a75] p-3">
        <div className="flex items-start justify-between">
          <div className="flex gap-2">
            {isCancelled && (
              <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-100 shadow-sm ring-1 ring-red-500/30">
                CANCELLED
              </span>
            )}
            {isLive && !isCancelled && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-red-100 shadow-sm ring-1 ring-red-500/30">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                LIVE NOW
              </span>
            )}
            {isRequested && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-200 shadow-sm ring-1 ring-amber-500/30 backdrop-blur-sm">
                PENDING
              </span>
            )}
            {isUpcoming && !isRequested && !isCancelled && (
              <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm ring-1 ring-white/20 backdrop-blur-sm">
                UPCOMING
              </span>
            )}
            {isEnded && !isCancelled && (
              <span className="flex items-center gap-1 rounded-full bg-slate-500/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-200 shadow-sm ring-1 ring-slate-400/30">
                ENDED
              </span>
            )}
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white backdrop-blur-sm">
              {session.visibility}
            </span>
          </div>
          
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide backdrop-blur-sm ${
              price > 0 ? "bg-[#FFC107]/20 text-[#FFC107]" : "bg-emerald-500/20 text-emerald-300"
            }`}
          >
            {price > 0 ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
            {price > 0 ? `ETB ${price}` : "FREE"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col px-4 pb-4 pt-0">
        {/* Avatar Overlap */}
        <div className="-mt-5 mb-2 flex items-end justify-between">
          <Avatar
            profileImage={session.teacher?.profileImage}
            name={`${session.teacher?.firstName || 'Unknown'} ${session.teacher?.lastName || ''}`.trim()}
            size="md"
            className="border-[3px] border-white shadow-sm bg-white"
          />
          {session.maxParticipants && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <Users className="h-3 w-3" />
              {session.maxParticipants} seats
            </div>
          )}
        </div>

        <h3 className="font-['Lexend'] text-base font-semibold leading-tight text-[#043658] line-clamp-2">
          {session.topic}
        </h3>
        
        <div className="mt-1 flex items-center gap-1 text-[13px] font-medium text-slate-600">
          {session.teacher?.firstName} {session.teacher?.lastName}
          {session.teacher?.isVerified !== false && (
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          )}
        </div>

        {session.description && (
          <p className="mt-1.5 text-[13px] leading-snug text-slate-500 line-clamp-2">
            {session.description}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[12px] font-medium text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {format(new Date(session.scheduledStart), "MMM d, h:mm a")}
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {session.duration} min
          </div>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-3">
        {isOwner ? (
          <div className="flex gap-2">
            {isCancelled ? (
              <div className="w-full rounded-xl bg-white px-3 py-1.5 text-center text-[13px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-200">
                Cancelled
                {session.hostActions && session.hostActions.paidParticipants > 0 && (
                  <div className="mt-1 text-[11px] font-medium text-slate-400">
                    {session.hostActions.paidParticipants} participants · {session.hostActions.totalCollected.toFixed(0)} ETB collected
                  </div>
                )}
              </div>
            ) : (
              <>
                {isUpcoming && isApproved && onEdit && (
                  <button
                    onClick={onEdit}
                    className="flex-1 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors"
                  >
                    Edit
                  </button>
                )}
                {session.hostActions?.canDelete && onDelete && (
                  <button
                    onClick={onDelete}
                    className="flex-1 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                )}
                {session.hostActions?.canCancel && onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50 transition-colors"
                  >
                    Cancel Session
                  </button>
                )}
                {!session.hostActions && isUpcoming && isRequested && onCancel && (
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-red-600 shadow-sm ring-1 ring-inset ring-red-200 hover:bg-red-50 transition-colors"
                  >
                    Cancel
                  </button>
                )}
                {isLive && onJoin && (
                  <button
                    onClick={onJoin}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#043658] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#032742] transition-colors"
                  >
                    <Video className="h-3.5 w-3.5" /> Enter Live Room
                  </button>
                )}
                {isEnded && (
                  <button
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200"
                    disabled
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> View Details
                  </button>
                )}
              </>
            )}
          </div>
        ) : isCancelled ? (
              <button
                disabled
                className="flex w-full items-center justify-center rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-500 shadow-sm ring-1 ring-inset ring-slate-200"
              >
                Session Cancelled
              </button>
            ) : (
          <div className="flex gap-2">
            {isLive && onJoin && (
              <button
                onClick={onJoin}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#043658] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#032742] transition-colors"
              >
                <Video className="h-3.5 w-3.5" /> Join Live
              </button>
            )}
            {isUpcoming && (
              <>
                <button
                  onClick={onJoin}
                  className={`flex-1 rounded-xl px-3 py-1.5 text-[13px] font-semibold shadow-sm ring-1 ring-inset transition-colors ${
                    price > 0 
                      ? "bg-white text-[#043658] ring-slate-200 hover:bg-slate-50"
                      : "bg-white text-[#043658] ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  View Details
                </button>
                {price > 0 ? (
                  onRegister && (
                    <button
                      onClick={onRegister}
                      className="flex-1 rounded-xl bg-[#FFC107] px-3 py-1.5 text-[13px] font-semibold text-[#043658] shadow-sm hover:bg-[#ffcd38] transition-colors"
                    >
                      Register & Pay
                    </button>
                  )
                ) : (
                  onRemind && (
                    <button
                      onClick={onRemind}
                      className="flex-1 rounded-xl bg-[#043658] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#032742] transition-colors"
                    >
                      Remind Me
                    </button>
                  )
                )}
              </>
            )}
            {isEnded && (
              <button
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[13px] font-semibold text-slate-600 shadow-sm ring-1 ring-inset ring-slate-200"
                disabled
              >
                Recording Unavailable
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
