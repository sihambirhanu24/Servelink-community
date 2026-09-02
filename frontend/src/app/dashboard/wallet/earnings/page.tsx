'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { paymentsApi } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Calendar, DollarSign, Filter, Download, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function EarningsPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');

  useEffect(() => {
    if (token) {
      loadWalletData();
    }
  }, [token]);

  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return 0;
  };

  const loadWalletData = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const data = await paymentsApi.getTeacherWallet(token);
      setWallet(data);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID_OUT':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filterEarnings = (earnings: any[]) => {
    let filtered = [...earnings];
    
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }
    
    if (dateFilter !== 'ALL') {
      const now = new Date();
      filtered = filtered.filter(e => {
        const earningDate = new Date(e.createdAt);
        if (dateFilter === 'THIS_MONTH') {
          return earningDate.getMonth() === now.getMonth() && 
                 earningDate.getFullYear() === now.getFullYear();
        }
        if (dateFilter === 'THIS_WEEK') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return earningDate >= weekAgo;
        }
        return true;
      });
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading earnings...</div>
      </div>
    );
  }

  const filteredEarnings = wallet?.recentEarnings ? filterEarnings(wallet.recentEarnings) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#043658]">Earnings</h1>
        <p className="text-gray-600 mt-1">View your teacher earnings from live sessions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Total Earnings</h3>
              <div className="text-2xl font-bold text-[#043658]">
                {formatNumber(wallet?.totalEarnings).toFixed(2)} ETB
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-[#043658]/20" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">This Month</h3>
              <div className="text-2xl font-bold text-green-600">
                {wallet?.recentEarnings
                  ?.filter((e: any) => {
                    const d = new Date(e.createdAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum: number, e: any) => sum + formatNumber(e.netAmount), 0)
                  .toFixed(2)} ETB
              </div>
            </div>
            <Calendar className="h-8 w-8 text-green-500/20" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Available</h3>
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(wallet?.availableEarnings).toFixed(2)} ETB
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-500/20" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Pending</h3>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(wallet?.pendingEarnings).toFixed(2)} ETB
              </div>
            </div>
            <Clock className="h-8 w-8 text-blue-500/20" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="PENDING">Pending</option>
            <option value="PAID_OUT">Paid Out</option>
          </select>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="ALL">All Time</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="THIS_WEEK">This Week</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 border rounded-md text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </Card>

      {/* Earnings Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Session</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Gross Amount</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Platform Fee</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Net Earnings</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEarnings.length > 0 ? (
                filteredEarnings.map((earning) => (
                  <tr key={earning.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{earning.liveSession?.topic || 'Session'}</p>
                        <p className="text-xs text-gray-500">{earning.liveSession?.duration} min</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {format(new Date(earning.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4 text-right text-sm">
                      {formatNumber(earning.grossAmount).toFixed(2)} ETB
                    </td>
                    <td className="py-3 px-4 text-right text-sm text-red-600">
                      -{formatNumber(earning.platformFee).toFixed(2)} ETB
                    </td>
                    <td className="py-3 px-4 text-right text-sm font-semibold text-green-600">
                      +{formatNumber(earning.netAmount).toFixed(2)} ETB
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(earning.status)}`}>
                        {earning.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No earnings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
