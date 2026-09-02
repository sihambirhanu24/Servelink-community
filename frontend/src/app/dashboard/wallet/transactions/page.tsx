'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { paymentsApi, Payout } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { Receipt, Search, Filter, ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [payoutHistory, setPayoutHistory] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

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
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARNING':
      case 'SESSION_PAYMENT':
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
      case 'PLATFORM_FEE':
      case 'WITHDRAWAL':
      case 'PAYOUT':
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Receipt className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'FAILED':
      case 'REJECTED':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'SUCCESS':
        return 'text-green-600';
      case 'PENDING':
      case 'PROCESSING':
        return 'text-yellow-600';
      case 'FAILED':
      case 'REJECTED':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getAmountColor = (type: string) => {
    switch (type) {
      case 'EARNING':
      case 'SESSION_PAYMENT':
        return 'text-green-600';
      case 'PLATFORM_FEE':
      case 'WITHDRAWAL':
      case 'PAYOUT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatAmount = (amount: any, type: string) => {
    const num = formatNumber(amount);
    const sign = ['EARNING', 'SESSION_PAYMENT'].includes(type) ? '+' : '-';
    return `${sign}${num.toFixed(2)} ETB`;
  };

  const combineTransactions = () => {
    const transactions: any[] = [];
    
    // Add earnings
    if (wallet?.recentEarnings) {
      wallet.recentEarnings.forEach((earning: any) => {
        transactions.push({
          id: earning.id,
          date: new Date(earning.createdAt),
          description: earning.liveSession?.topic || 'Live Session Earning',
          type: 'EARNING',
          reference: earning.paymentId || earning.id,
          status: earning.status,
          amount: formatNumber(earning.netAmount),
          balanceAfter: null,
        });
      });
    }
    
    // Add payouts
    payoutHistory.forEach((payout) => {
      transactions.push({
        id: payout.id,
        date: new Date(payout.createdAt),
        description: `Payout to ${payout.bankName}`,
        type: 'PAYOUT',
        reference: payout.reference,
        status: payout.status,
        amount: formatNumber(payout.amount),
        balanceAfter: null,
      });
    });
    
    // Sort by date descending
    return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const filterTransactions = (transactions: any[]) => {
    let filtered = [...transactions];
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== 'ALL') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading transactions...</div>
      </div>
    );
  }

  const allTransactions = combineTransactions();
  const filteredTransactions = filterTransactions(allTransactions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#043658]">Transactions</h1>
        <p className="text-gray-600 mt-1">View all your wallet transactions</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-md text-sm"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="ALL">All Types</option>
            <option value="EARNING">Earnings</option>
            <option value="PAYOUT">Payouts</option>
            <option value="PLATFORM_FEE">Platform Fees</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Reference</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(transaction.date, 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="font-medium">{transaction.description}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        {transaction.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 font-mono">
                      {transaction.reference.slice(0, 12)}...
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(transaction.status)}
                        <span className={`text-sm ${getStatusColor(transaction.status)}`}>
                          {transaction.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      <span className={getAmountColor(transaction.type)}>
                        {formatAmount(transaction.amount, transaction.type)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing {filteredTransactions.length} of {allTransactions.length} transactions
            </p>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded-md text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 border rounded-md text-sm hover:bg-gray-50 disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
