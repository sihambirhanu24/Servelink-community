'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { paymentsApi, WalletData, Payout } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { ArrowUpRight, Clock, CheckCircle, AlertCircle, XCircle, Wallet, Calendar, RefreshCw, Receipt, X } from 'lucide-react';
import { format } from 'date-fns';
import { RequestPayoutModal } from '@/components/wallet/RequestPayoutModal';
import { useRouter } from 'next/navigation';

export default function PayoutsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [verifyingPayout, setVerifyingPayout] = useState<string | null>(null);
  const [cancellingPayout, setCancellingPayout] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return 0;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const [walletData, payoutData] = await Promise.all([
        paymentsApi.getTeacherWallet(token),
        paymentsApi.getPayoutHistory(token),
      ]);
      setWallet(walletData);
      setPayoutHistory(payoutData);
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayout = async (reference: string) => {
    try {
      setVerifyingPayout(reference);
      await paymentsApi.verifyPayoutStatus(reference, token!);
      await loadData(); // Refresh to get updated status
    } catch (err: any) {
      console.error('Failed to verify payout:', err);
      if (err.response?.status === 404) {
        alert('Payout not found. It may have been cancelled or deleted. Refreshing the page...');
        await loadData(); // Refresh to remove stale payouts
      } else {
        alert('Failed to verify payout status. Please try again.');
      }
    } finally {
      setVerifyingPayout(null);
    }
  };

  const handleCancelPayout = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this payout request?')) {
      return;
    }

    try {
      setCancellingPayout(id);
      await paymentsApi.cancelPayout(id, token!);
      await loadData(); // Refresh to get updated status
    } catch (err) {
      console.error('Failed to cancel payout:', err);
      alert('Failed to cancel payout. Please try again.');
    } finally {
      setCancellingPayout(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <XCircle className="h-4 w-4" />;
      case 'FAILED':
        return <AlertCircle className="h-4 w-4" />;
      case 'PROCESSING':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return null;
    }
  };

  const filterPayouts = (payouts: Payout[]) => {
    if (filterStatus === 'ALL') return payouts;
    return payouts.filter(p => p.status === filterStatus);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading payouts...</div>
      </div>
    );
  }

  const filteredPayouts = filterPayouts(payoutHistory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#043658]">Payouts</h1>
        <p className="text-gray-600 mt-1">Manage your withdrawal requests</p>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Available Balance</h3>
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(wallet?.availableEarnings).toFixed(2)} ETB
              </div>
            </div>
            <Wallet className="h-8 w-8 text-yellow-500/20" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Minimum Payout</h3>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(wallet?.minPayoutAmount).toFixed(2)} ETB
              </div>
            </div>
            <ArrowUpRight className="h-8 w-8 text-blue-500/20" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Platform Fee</h3>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(wallet?.platformFeePercent)}%
              </div>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500/20" />
          </div>
        </Card>
      </div>

      {/* Request Payout */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5" />
          Request Payout
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Available: <span className="font-semibold">{formatNumber(wallet?.availableEarnings).toFixed(2)} ETB</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Minimum payout: {formatNumber(wallet?.minPayoutAmount).toFixed(2)} ETB | Platform fee: {formatNumber(wallet?.platformFeePercent)}%
            </p>
          </div>
          <Button
            onClick={() => setShowPayoutModal(true)}
            disabled={!wallet || formatNumber(wallet?.availableEarnings) < formatNumber(wallet?.minPayoutAmount)}
          >
            Request Payout
          </Button>
        </div>
      </Card>

      {/* Payout History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Payout History</h2>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
        
        {filteredPayouts.length > 0 ? (
          <div className="space-y-3">
            {filteredPayouts.map((payout) => (
              <div key={payout.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Ref: {payout.reference}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Bank</p>
                        <p className="font-medium">{payout.bankName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Account</p>
                        <p className="font-medium">****{payout.bankAccountNumber?.slice(-4)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium">{format(new Date(payout.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-semibold text-[#043658]">{formatNumber(payout.amount).toFixed(2)} ETB</p>
                      </div>
                    </div>
                    {payout.status === 'PROCESSING' && payout.chapaReference && (
                      <div className="mt-2 text-xs text-purple-600">
                        Chapa Reference: {payout.chapaReference}
                      </div>
                    )}
                    {payout.status === 'COMPLETED' && payout.bankReference && (
                      <div className="mt-2 text-xs text-green-600">
                        Bank Reference: {payout.bankReference}
                      </div>
                    )}
                    {payout.rejectionReason && (
                      <div className="mt-2 text-sm text-red-600">
                        Reason: {payout.rejectionReason}
                      </div>
                    )}
                    {payout.approvedAt && (
                      <div className="mt-1 text-xs text-gray-500">
                        Approved: {format(new Date(payout.approvedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    )}
                    {payout.completedAt && (
                      <div className="mt-1 text-xs text-gray-500">
                        Completed: {format(new Date(payout.completedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    )}
                    {payout.status === 'PENDING' && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleCancelPayout(payout.id)}
                          disabled={cancellingPayout === payout.id}
                          className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {cancellingPayout === payout.id ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="h-3 w-3" /> Cancel Request
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {payout.status === 'PROCESSING' && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleVerifyPayout(payout.reference)}
                          disabled={verifyingPayout === payout.reference}
                          className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-[#FFC107] text-[#043658] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {verifyingPayout === payout.reference ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin" /> Verifying...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="h-3 w-3" /> Check Status
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    {payout.status === 'COMPLETED' && (
                      <div className="mt-2">
                        <button
                          onClick={() => router.push(`/dashboard/wallet/payouts/${payout.reference}/receipt`)}
                          className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-[#FFC107] text-[#043658] hover:bg-yellow-400 flex items-center gap-2"
                        >
                          <Receipt className="h-3 w-3" /> View Receipt
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {getStatusIcon(payout.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Wallet className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No payout history</p>
          </div>
        )}
      </Card>

      {/* Request Payout Modal */}
      {wallet && (
        <RequestPayoutModal
          isOpen={showPayoutModal}
          onClose={() => setShowPayoutModal(false)}
          availableBalance={formatNumber(wallet.availableEarnings)}
          minPayoutAmount={formatNumber(wallet.minPayoutAmount)}
          platformFeePercent={formatNumber(wallet.platformFeePercent)}
        />
      )}
    </div>
  );
}
