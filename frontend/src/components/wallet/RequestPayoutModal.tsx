"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Wallet, Building2, CreditCard, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentsApi } from "@/services/payments";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface RequestPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  minPayoutAmount: number;
  platformFeePercent: number;
  onSuccess?: () => void;
}

export function RequestPayoutModal({
  isOpen,
  onClose,
  availableBalance,
  minPayoutAmount,
  platformFeePercent,
  onSuccess,
}: RequestPayoutModalProps) {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [amount, setAmount] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");

  const { data: chapaBanksData, isLoading: isLoadingBanks } = useQuery({
    queryKey: ["chapaBanks"],
    queryFn: () => paymentsApi.getChapaBanks(token!),
    enabled: !!token && isOpen,
  });

  const banks = chapaBanksData?.data || [];

  const requestMutation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("Not authenticated");
      return await paymentsApi.requestPayout(
        {
          amount: Number(amount),
          bankCode,
          bankAccountNumber,
          bankAccountName,
        },
        token,
      );
    },
    onSuccess: () => {
      toast.success("Payout request submitted successfully!");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["payouts"] });
      reset();
      onClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to submit payout request");
    },
  });

  function reset() {
    setAmount("");
    setBankCode("");
    setBankAccountNumber("");
    setBankAccountName("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (Number(amount) < minPayoutAmount) {
      toast.error(`Minimum payout amount is ${minPayoutAmount} ETB`);
      return;
    }

    if (Number(amount) > availableBalance) {
      toast.error(`Insufficient balance. Available: ${availableBalance.toFixed(2)} ETB`);
      return;
    }

    if (!bankCode) {
      toast.error("Please select a bank or payout method");
      return;
    }

    if (!bankAccountNumber || bankAccountNumber.length < 10) {
      toast.error("Please enter a valid account number");
      return;
    }

    if (!bankAccountName || bankAccountName.length < 3) {
      toast.error("Please enter a valid account name");
      return;
    }

    requestMutation.mutate();
  }

  if (!isOpen) return null;



  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#043658]" />
            <h2 className="text-lg font-bold text-[#043658]">Request Payout</h2>
          </div>
          <button
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance Info */}
        <div className="bg-[#043658]/5 border-b border-[#043658]/10 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Available Balance
              </p>
              <p className="text-2xl font-bold text-[#043658]">
                {availableBalance.toFixed(2)} ETB
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Minimum: {minPayoutAmount} ETB</p>
              <p className="text-xs text-slate-500">Platform Fee: {platformFeePercent}%</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Amount (ETB) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min={minPayoutAmount}
              max={availableBalance}
              step="0.01"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
            <p className="mt-1 text-[10px] text-slate-400">
              Min: {minPayoutAmount} ETB • Max: {availableBalance.toFixed(2)} ETB
            </p>
          </div>

          {/* Bank Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Bank / Payout Method <span className="text-red-500">*</span>
            </label>
            <select
              value={bankCode}
              onChange={(e) => setBankCode(e.target.value)}
              disabled={isLoadingBanks}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none disabled:bg-slate-50"
            >
              <option value="">
                {isLoadingBanks ? "Loading methods..." : "Select a payout method"}
              </option>
              {banks.map((bank: any) => (
                <option key={bank.id} value={bank.id}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter account number"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Account Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankAccountName}
              onChange={(e) => setBankAccountName(e.target.value)}
              placeholder="Enter account holder name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
            />
          </div>

          {/* Info Note */}
          <div className="flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
            <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700">
              Payouts are processed automatically via Chapa. You'll receive a notification when your transfer is complete.
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={requestMutation.isPending}
            className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={requestMutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60"
          >
            {requestMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" /> Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
