'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface CancelSessionModalProps {
  open: boolean;
  topic: string;
  paidParticipants: number;
  totalCollected: number;
  refundDisclaimer: string;
  isPending?: boolean;
  onKeep: () => void;
  onConfirm: () => void;
}

export function CancelSessionModal({
  open,
  topic,
  paidParticipants,
  totalCollected,
  refundDisclaimer,
  isPending,
  onKeep,
  onConfirm,
}: CancelSessionModalProps) {
  if (!open) return null;

  const hasPaidParticipants = paidParticipants > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b p-6">
          <h2 className="text-xl font-bold text-[#043658]">
            {hasPaidParticipants ? 'Cancel Paid Session?' : 'Cancel Session?'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{topic}</p>
        </div>
        <div className="space-y-4 p-6">
          {hasPaidParticipants ? (
            <p className="text-sm text-slate-600">
              This session has paid participants. Cancelling the session will prevent the session from continuing and may trigger the refund process.
            </p>
          ) : (
            <p className="text-sm text-slate-600">
              Cancelling will prevent this session from continuing. This cannot be undone.
            </p>
          )}
          {hasPaidParticipants && (
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Paid participants</span>
                <span className="font-semibold text-slate-800">{paidParticipants}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Total collected</span>
                <span className="font-semibold text-slate-800">{totalCollected.toFixed(2)} ETB</span>
              </div>
              <div className="mt-2 text-xs text-slate-500">{refundDisclaimer}</div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onKeep}
              disabled={isPending}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50"
            >
              Keep Session
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isPending}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
