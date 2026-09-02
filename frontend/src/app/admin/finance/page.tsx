'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { paymentsApi } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, DollarSign, TrendingUp, Users, Clock, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminFinancePage() {
  const { token } = useAuth();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [payouts, setPayouts] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadDashboard();
      loadPayouts();
    }
  }, [token, statusFilter, page]);

  const loadDashboard = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const data = await paymentsApi.getFinanceDashboard(token);
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load finance dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPayouts = async () => {
    if (!token) return;
    try {
      const data = await paymentsApi.getAllPayouts(token, statusFilter, page);
      setPayouts(data);
    } catch (err) {
      console.error('Failed to load payouts:', err);
    }
  };

  const handleApprove = async (id: string) => {
    if (!token) return;
    try {
      setProcessingId(id);
      await paymentsApi.approvePayout(id, token);
      loadDashboard();
      loadPayouts();
    } catch (err) {
      console.error('Failed to approve payout:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!token) return;
    try {
      setProcessingId(id);
      await paymentsApi.rejectPayout(id, reason, token);
      loadDashboard();
      loadPayouts();
    } catch (err) {
      console.error('Failed to reject payout:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleProcess = async (id: string) => {
    if (!token) return;
    try {
      setProcessingId(id);
      await paymentsApi.processPayout(id, token);
      loadDashboard();
      loadPayouts();
    } catch (err) {
      console.error('Failed to process payout:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleComplete = async (id: string) => {
    if (!token) return;
    try {
      setProcessingId(id);
      await paymentsApi.completePayout(id, token);
      loadDashboard();
      loadPayouts();
    } catch (err) {
      console.error('Failed to complete payout:', err);
    } finally {
      setProcessingId(null);
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
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-[#043658]">Finance Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#043658]">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Volume
            </h3>
            <div className="text-xl font-bold text-[#043658]">
              {Number(dashboard?.totalPaymentVolume).toFixed(2)} ETB
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Platform Revenue
            </h3>
            <div className="text-xl font-bold text-green-600">
              {Number(dashboard?.platformRevenue).toFixed(2)} ETB
            </div>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teacher Earnings
            </h3>
            <div className="text-xl font-bold text-blue-600">
              {Number(dashboard?.teacherEarningsTotal).toFixed(2)} ETB
            </div>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Payouts
            </h3>
            <div className="text-xl font-bold text-yellow-600">{dashboard?.pendingPayouts}</div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed Payouts
            </h3>
            <div className="text-xl font-bold text-green-600">{dashboard?.completedPayouts}</div>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Failed Payments
            </h3>
            <div className="text-xl font-bold text-red-600">{dashboard?.failedPayments}</div>
          </Card>
        </div>

        {/* Payout Management */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Payout Management</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          {payouts?.payouts && payouts.payouts.length > 0 ? (
            <div className="space-y-4">
              {payouts.payouts.map((payout: any) => (
                <div key={payout.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{payout.teacher?.firstName} {payout.teacher?.lastName}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                          {payout.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{payout.teacher?.email}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Amount:</span>{' '}
                          <span className="font-semibold">{Number(payout.amount).toFixed(2)} ETB</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bank:</span>{' '}
                          <span className="font-semibold">{payout.bankName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Account:</span>{' '}
                          <span className="font-semibold">{payout.bankAccountNumber}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Account Name:</span>{' '}
                          <span className="font-semibold">{payout.bankAccountName}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Reference:</span>{' '}
                          <span className="font-semibold">{payout.reference}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Requested:</span>{' '}
                          <span className="font-semibold">{new Date(payout.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {payout.rejectionReason && (
                        <p className="text-sm text-red-600 mt-2">
                          <span className="font-semibold">Rejection Reason:</span> {payout.rejectionReason}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      {payout.status === 'PENDING' && (
                        <>
                          <Button
                            onClick={() => handleApprove(payout.id)}
                            disabled={processingId === payout.id}
                          >
                            {processingId === payout.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                            Approve
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              const reason = prompt('Enter rejection reason:');
                              if (reason) handleReject(payout.id, reason);
                            }}
                            disabled={processingId === payout.id}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </>
                      )}
                      {payout.status === 'APPROVED' && (
                        <Button
                          onClick={() => handleProcess(payout.id)}
                          disabled={processingId === payout.id}
                        >
                          {processingId === payout.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Clock className="h-4 w-4" />
                          )}
                          Process
                        </Button>
                      )}
                      {payout.status === 'PROCESSING' && (
                        <Button
                          onClick={() => handleComplete(payout.id)}
                          disabled={processingId === payout.id}
                        >
                          {processingId === payout.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          Complete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {payouts.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {payouts.totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.min(payouts.totalPages, p + 1))}
                    disabled={page === payouts.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No payouts found</p>
          )}
        </Card>

        {/* Recent Transactions */}
        <Card>
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {dashboard.recentTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{transaction.teacher?.firstName} {transaction.teacher?.lastName}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.liveSession?.topic || 'Session'} • {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{Number(transaction.amount).toFixed(2)} ETB</p>
                    <p className={`text-sm ${
                      transaction.status === 'SUCCESSFUL' ? 'text-green-600' : 
                      transaction.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions</p>
          )}
        </Card>
      </div>
    </div>
  );
}
