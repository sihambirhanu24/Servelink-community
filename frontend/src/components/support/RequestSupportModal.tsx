"use client";

import { useState, useEffect } from "react";
import {
  X,
  MessageCircle,
  Video,
  FileText,
  Users,
  Loader2,
  Calendar,
  DollarSign,
  Wallet,
} from "lucide-react";
import { useCreateSupportRequest } from "@/hooks/useSupport";
import { useAuth } from "@/context/AuthContext";
import { walletApi } from "@/services/wallet";
import type {
  SupportType,
  SupportUrgency,
  CreateSupportRequestDto,
  SupportPaymentType,
} from "@/services/support";

interface RequestSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  providerId?: string;
}

const SUPPORT_TYPES: {
  value: SupportType;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    value: "CHAT",
    label: "Chat Support",
    icon: <MessageCircle className="h-4 w-4" />,
    description: "Text-based conversation",
  },
  {
    value: "LIVE_SESSION",
    label: "Live Session",
    icon: <Video className="h-4 w-4" />,
    description: "Video meeting",
  },
  {
    value: "RESOURCE",
    label: "Resource Sharing",
    icon: <FileText className="h-4 w-4" />,
    description: "Share materials",
  },
  {
    value: "MENTORSHIP",
    label: "Mentorship",
    icon: <Users className="h-4 w-4" />,
    description: "Ongoing guidance",
  },
];

const URGENCY_LEVELS: {
  value: SupportUrgency;
  label: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "LOW",
    label: "Low",
    color: "text-slate-700",
    bg: "bg-slate-100 hover:bg-slate-200",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    color: "text-amber-700",
    bg: "bg-amber-100 hover:bg-amber-200",
  },
  {
    value: "HIGH",
    label: "High",
    color: "text-rose-700",
    bg: "bg-rose-100 hover:bg-rose-200",
  },
];

export function RequestSupportModal({
  isOpen,
  onClose,
  providerId,
}: RequestSupportModalProps) {
  const { token } = useAuth();
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [supportType, setSupportType] = useState<SupportType>("MENTORSHIP");
  const [urgency, setUrgency] = useState<SupportUrgency>("MEDIUM");
  const [preferredAt, setPreferredAt] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentType, setPaymentType] = useState<SupportPaymentType>("FREE");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [paymentReason, setPaymentReason] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const createRequest = useCreateSupportRequest();

  // Load wallet balance when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoadingBalance(true);
      walletApi
        .getBalance()
        .then((balance) => {
          setWalletBalance(balance.availableBalance);
        })
        .catch((error) => {
          console.error("Failed to load wallet balance:", error);
        })
        .finally(() => {
          setLoadingBalance(false);
        });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!topic.trim() || topic.trim().length < 3) {
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      return;
    }

    if (paymentType === "PAID") {
      const amount = parseFloat(requestedAmount);
      if (!requestedAmount || isNaN(amount) || amount <= 0) {
        return;
      }
      if (!paymentReason.trim() || paymentReason.trim().length < 10) {
        return;
      }
      if (walletBalance !== null && amount > walletBalance) {
        return;
      }
    }

    const data: CreateSupportRequestDto = {
      topic: topic.trim(),
      description: description.trim(),
      supportType,
      urgency,
      ...(preferredAt && { preferredAt }),
      ...(notes.trim() && { notes: notes.trim() }),
      ...(providerId && { providerId }),
      paymentType,
      ...(paymentType === "PAID" && {
        requestedAmount: parseFloat(requestedAmount),
        paymentReason: paymentReason.trim(),
      }),
    };

    createRequest.mutate(data, {
      onSuccess: () => {
        // Reset form
        setTopic("");
        setDescription("");
        setSupportType("MENTORSHIP");
        setUrgency("MEDIUM");
        setPreferredAt("");
        setNotes("");
        setPaymentType("FREE");
        setRequestedAmount("");
        setPaymentReason("");
        onClose();
      },
    });
  };

  if (!isOpen) return null;

  const amount = parseFloat(requestedAmount);
  const hasInsufficientBalance =
    paymentType === "PAID" &&
    walletBalance !== null &&
    !isNaN(amount) &&
    amount > walletBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-900">Request Support</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            disabled={createRequest.isPending}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Topic / Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Need help with React hooks"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
              maxLength={200}
              required
              disabled={createRequest.isPending}
            />
            <p className="mt-1 text-xs text-slate-500">
              {topic.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about what you need help with..."
              rows={5}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
              maxLength={2000}
              required
              disabled={createRequest.isPending}
            />
            <p className="mt-1 text-xs text-slate-500">
              {description.length}/2000 characters (minimum 10)
            </p>
          </div>

          {/* Support Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Support Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setSupportType(type.value)}
                  className={`flex items-start gap-3 p-4 border-2 rounded-xl transition-all text-left ${
                    supportType === type.value
                      ? "border-[#043658] bg-[#043658]/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  disabled={createRequest.isPending}
                >
                  <div
                    className={`mt-0.5 ${
                      supportType === type.value
                        ? "text-[#043658]"
                        : "text-slate-400"
                    }`}
                  >
                    {type.icon}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`text-sm font-semibold ${
                        supportType === type.value
                          ? "text-[#043658]"
                          : "text-slate-700"
                      }`}
                    >
                      {type.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {type.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Urgency <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-3">
              {URGENCY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setUrgency(level.value)}
                  className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                    urgency === level.value
                      ? `${level.bg} border-current ${level.color}`
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                  disabled={createRequest.isPending}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Date/Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Preferred Date/Time (Optional)
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="datetime-local"
                value={preferredAt}
                onChange={(e) => setPreferredAt(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent transition-all text-slate-900"
                disabled={createRequest.isPending}
              />
            </div>
          </div>

          {/* Payment Type */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Payment Type <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("FREE")}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                  paymentType === "FREE"
                    ? "bg-emerald-100 border-emerald-600 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                disabled={createRequest.isPending}
              >
                Free Support
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("PAID")}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all border-2 ${
                  paymentType === "PAID"
                    ? "bg-amber-100 border-amber-600 text-amber-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
                disabled={createRequest.isPending}
              >
                Paid Support
              </button>
            </div>
          </div>

          {/* Payment Fields (shown only for PAID) */}
          {paymentType === "PAID" && (
            <>
              {/* Wallet Balance Display */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-[#043658]" />
                    <span className="text-sm font-semibold text-slate-700">
                      Available Balance
                    </span>
                  </div>
                  <div className="text-lg font-bold text-[#043658]">
                    {loadingBalance ? (
                      <span className="text-sm text-slate-500">Loading...</span>
                    ) : walletBalance !== null ? (
                      `${walletBalance.toFixed(2)} ETB`
                    ) : (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Requested Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Amount (ETB) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    value={requestedAmount}
                    onChange={(e) => setRequestedAmount(e.target.value)}
                    placeholder="Enter amount (e.g., 200)"
                    min="1"
                    step="0.01"
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400 ${
                      hasInsufficientBalance
                        ? "border-rose-500 bg-rose-50"
                        : "border-slate-300"
                    }`}
                    required
                    disabled={createRequest.isPending}
                  />
                </div>
                {hasInsufficientBalance && (
                  <p className="mt-2 text-sm text-rose-600 font-medium">
                    Insufficient balance. You need {amount.toFixed(2)} ETB but
                    only have {walletBalance?.toFixed(2)} ETB available.
                  </p>
                )}
              </div>

              {/* Payment Reason */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Payment Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  placeholder="Explain why you're offering to pay for this support (e.g., 'I need approximately one hour of help understanding JWT authentication')"
                  rows={3}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
                  minLength={10}
                  maxLength={500}
                  required
                  disabled={createRequest.isPending}
                />
                <p className="mt-1 text-xs text-slate-500">
                  {paymentReason.length}/500 characters (minimum 10)
                </p>
              </div>
            </>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent transition-all resize-none text-slate-900 placeholder:text-slate-400"
              maxLength={500}
              disabled={createRequest.isPending}
            />
            <p className="mt-1 text-xs text-slate-500">
              {notes.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              disabled={createRequest.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createRequest.isPending ||
                !topic.trim() ||
                topic.trim().length < 3 ||
                !description.trim() ||
                description.trim().length < 10 ||
                (paymentType === "PAID" &&
                  (!requestedAmount ||
                    parseFloat(requestedAmount) <= 0 ||
                    !paymentReason.trim() ||
                    paymentReason.trim().length < 10 ||
                    hasInsufficientBalance))
              }
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-[#043658] hover:bg-[#043658]/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : paymentType === "PAID" ? (
                `Reserve ${requestedAmount || "0"} ETB & Submit`
              ) : (
                "Submit Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
