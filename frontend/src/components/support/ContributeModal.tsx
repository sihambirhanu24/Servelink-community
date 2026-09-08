"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { financialSupportApi, FinancialSupportRequest } from "@/services/financial-support";
import { paymentsApi } from "@/services/payments";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DollarSign, Heart, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: FinancialSupportRequest;
  onSuccess: () => void;
}

export default function ContributeModal({
  isOpen,
  onClose,
  request,
  onSuccess,
}: ContributeModalProps) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(true);

  // Fetch wallet balance when modal opens
  useEffect(() => {
    if (isOpen && token) {
      fetchWalletBalance();
    } else {
      // Reset when modal closes
      setAmount(0);
      setError("");
    }
  }, [isOpen, token]);

  const fetchWalletBalance = async () => {
    setLoadingBalance(true);
    try {
      // Use the SAME endpoint as the Wallet page - paymentsApi.getTeacherWallet
      const wallet = await paymentsApi.getTeacherWallet(token!);
      
      // Extract availableEarnings (the spendable balance)
      const availableBalance = formatNumber(wallet.availableEarnings);
      
      console.log("✓ Wallet data fetched successfully:", {
        totalEarnings: wallet.totalEarnings,
        availableEarnings: wallet.availableEarnings,
        pendingEarnings: wallet.pendingEarnings,
        parsedAvailableBalance: availableBalance
      });
      
      setWalletBalance(availableBalance);
    } catch (error: any) {
      console.error("✗ Failed to fetch wallet balance:", error);
      toast.error("Failed to load wallet balance");
      setWalletBalance(0);
    } finally {
      setLoadingBalance(false);
    }
  };

  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    if (value && typeof value === 'object') return Number(value.toString()) || 0;
    return 0;
  };

  const remaining = Number(request.amountNeeded) - Number(request.amountReceived);
  const maxContribution = Math.min(remaining, walletBalance);

  const validate = () => {
    if (!amount || amount <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }

    if (amount > walletBalance) {
      setError(`Insufficient balance. You have ${walletBalance.toFixed(2)} ETB`);
      return false;
    }

    if (amount > remaining) {
      setError(`Cannot exceed remaining amount: ${remaining.toFixed(2)} ETB`);
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setLoading(true);
      await financialSupportApi.contribute({
        supportRequestId: request.id,
        amount,
      });
      
      // Show success message
      toast.success(`Successfully contributed ${amount.toFixed(2)} ETB!`);
      
      // Invalidate ALL wallet and financial support queries to refresh data everywhere
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-requests'] });
      queryClient.invalidateQueries({ queryKey: ['financial-contributions'] });
      
      // Refetch wallet balance in modal to show updated amount
      await fetchWalletBalance();
      
      // Call parent success handler (to refresh the request list)
      onSuccess();
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to contribute");
    } finally {
      setLoading(false);
    }
  };

  const setQuickAmount = (percentage: number) => {
    const quickAmount = Math.min((remaining * percentage) / 100, walletBalance);
    setAmount(parseFloat(quickAmount.toFixed(2)));
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Contribute to Support Request
          </DialogTitle>
          <DialogDescription>
            Help {request.requester.firstName} {request.requester.lastName} reach their goal
          </DialogDescription>
        </DialogHeader>

        {loadingBalance ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#043658] mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading wallet balance...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
          {/* Request Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Goal:</span>
              <span className="font-semibold">{Number(request.amountNeeded).toFixed(2)} ETB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Received:</span>
              <span className="font-semibold text-green-600">
                {Number(request.amountReceived).toFixed(2)} ETB
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining:</span>
              <span className="font-semibold text-blue-600">{remaining.toFixed(2)} ETB</span>
            </div>
            <Progress
              value={(Number(request.amountReceived) / Number(request.amountNeeded)) * 100}
              className="h-2"
            />
          </div>

          {/* Reason */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm font-medium text-blue-900 mb-1">Reason:</p>
            <p className="text-sm text-blue-800">{request.reason}</p>
          </div>

          {/* Wallet Balance Warning */}
          {walletBalance < 10 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                Your wallet balance is low: {walletBalance.toFixed(2)} ETB
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <Label htmlFor="amount">
                Contribution Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  max={maxContribution}
                  step="0.01"
                  placeholder="Enter amount to contribute"
                  value={amount || ""}
                  onChange={(e) => {
                    setAmount(parseFloat(e.target.value) || 0);
                    setError("");
                  }}
                  className={error ? "border-red-500" : ""}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ETB
                </span>
              </div>
              {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <Label className="text-sm text-gray-600 mb-2 block">Quick amounts:</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(25)}
                  disabled={remaining <= 0}
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(50)}
                  disabled={remaining <= 0}
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(75)}
                  disabled={remaining <= 0}
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickAmount(100)}
                  disabled={remaining <= 0}
                >
                  100%
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Your Wallet Balance:</span>
                <span className="font-semibold">{walletBalance.toFixed(2)} ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Contribution Amount:</span>
                <span className="font-semibold text-green-600">-{amount.toFixed(2)} ETB</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-sm">
                <span className="text-gray-600">Balance After:</span>
                <span className="font-bold">{(walletBalance - amount).toFixed(2)} ETB</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !amount || amount <= 0}>
                {loading ? "Contributing..." : `Contribute ${amount.toFixed(2)} ETB`}
              </Button>
            </div>
          </form>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
