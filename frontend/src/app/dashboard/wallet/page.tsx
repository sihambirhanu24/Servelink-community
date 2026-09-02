'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { paymentsApi, WalletData, Payout } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { Wallet, TrendingUp, Clock, CheckCircle, AlertCircle, DollarSign, ArrowUpRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { RequestPayoutModal } from '@/components/wallet/RequestPayoutModal';

export default function WalletPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  // React Query for wallet data
  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => paymentsApi.getTeacherWallet(token!),
    enabled: !!token,
  });

  // React Query for payout history
  const { data: payoutHistory = [], isLoading: payoutsLoading, refetch: refetchPayouts } = useQuery({
    queryKey: ['payouts'],
    queryFn: () => paymentsApi.getPayoutHistory(token!),
    enabled: !!token,
  });

  const loading = walletLoading || payoutsLoading;

  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return 0;
  };

  const handlePayoutSuccess = () => {
    // Invalidate all related queries to update UI immediately
    qc.invalidateQueries({ queryKey: ['wallet'] });
    qc.invalidateQueries({ queryKey: ['payouts'] });
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['earnings'] });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600';
      case 'APPROVED':
        return 'text-blue-600';
      case 'PROCESSING':
        return 'text-purple-600';
      case 'COMPLETED':
        return 'text-green-600';
      case 'REJECTED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading wallet...</div>
      </div>
    );
  }

  const totalEarnings = formatNumber(wallet?.totalEarnings);
  const availableEarnings = formatNumber(wallet?.availableEarnings);
  const pendingEarnings = formatNumber(wallet?.pendingEarnings);
  const paidOutEarnings = formatNumber(wallet?.paidOutEarnings);
  const minPayoutAmount = formatNumber(wallet?.minPayoutAmount);
  const platformFeePercent = formatNumber(wallet?.platformFeePercent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#043658]">Wallet</h1>
        <p className="text-gray-600 mt-1">Manage your earnings and withdrawals</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#043658]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earnings</h3>
              <div className="text-2xl font-bold text-[#043658]">
                {totalEarnings.toFixed(2)} ETB
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-[#043658]/20" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Available Balance</h3>
              <div className="text-2xl font-bold text-yellow-600">
                {availableEarnings.toFixed(2)} ETB
              </div>
            </div>
            <Wallet className="h-8 w-8 text-yellow-500/20" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pending Earnings</h3>
              <div className="text-2xl font-bold text-blue-600">
                {pendingEarnings.toFixed(2)} ETB
              </div>
            </div>
            <Clock className="h-8 w-8 text-blue-500/20" />
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Withdrawn</h3>
              <div className="text-2xl font-bold text-green-600">
                {paidOutEarnings.toFixed(2)} ETB
              </div>
            </div>
            <ArrowUpRight className="h-8 w-8 text-green-500/20" />
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          onClick={() => router.push('/dashboard/wallet/earnings')}
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          View Earnings
        </Button>
        <Button
          onClick={() => router.push('/dashboard/wallet/transactions')}
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          View Transactions
        </Button>
        <Button
          onClick={() => router.push('/dashboard/wallet/payouts')}
          variant="secondary"
          className="flex items-center justify-center gap-2"
        >
          <ArrowUpRight className="h-4 w-4" />
          Payout History
        </Button>
      </div>

      {/* Request Payout */}
      <Card>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Request Payout
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Available: <span className="font-semibold">{availableEarnings.toFixed(2)} ETB</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Minimum payout: {minPayoutAmount} ETB | Platform fee: {platformFeePercent}%
            </p>
          </div>
          <Button
            onClick={() => setShowPayoutModal(true)}
            disabled={walletLoading}
          >
            {walletLoading ? 'Loading...' : 'Request Payout'}
          </Button>
        </div>
      </Card>

      {/* Recent Earnings */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Earnings
          </h2>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/wallet/earnings')}
          >
            View All
          </Button>
        </div>
        {wallet?.recentEarnings && wallet.recentEarnings.length > 0 ? (
          <div className="space-y-3">
            {wallet.recentEarnings.slice(0, 5).map((earning) => (
              <div key={earning.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{earning.liveSession?.topic || 'Session'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(earning.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+{formatNumber(earning.netAmount).toFixed(2)} ETB</p>
                  <p className="text-xs text-gray-500">Fee: {formatNumber(earning.platformFee).toFixed(2)} ETB</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No recent earnings</p>
        )}
      </Card>

      {/* Recent Payouts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Payouts</h2>
          <Button
            variant="secondary"
            onClick={() => router.push('/dashboard/wallet/payouts')}
          >
            View All
          </Button>
        </div>
        {payoutHistory.length > 0 ? (
          <div className="space-y-3">
            {payoutHistory.slice(0, 5).map((payout) => (
              <div key={payout.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{payout.bankName}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(payout.createdAt).toLocaleDateString()} • Ref: {payout.reference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatNumber(payout.amount).toFixed(2)} ETB</p>
                  <p className={`text-sm ${getStatusColor(payout.status)} flex items-center justify-end gap-1`}>
                    {getStatusIcon(payout.status)}
                    {payout.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No payout history</p>
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
          onSuccess={handlePayoutSuccess}
        />
      )}
    </div>
  );
}
