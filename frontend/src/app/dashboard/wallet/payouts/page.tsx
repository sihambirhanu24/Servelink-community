'use client';

import { useEffect, useState, useRef } from 'react';
import Card from '@/components/ui/Card';
import { paymentsApi, type Payout } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { Download, FileText, RefreshCw, CheckCircle, Clock, XCircle, AlertCircle, X, Printer } from 'lucide-react';
import { format } from 'date-fns';

export default function PayoutsPage() {
  const { token, user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (token) {
      loadPayouts();
    }
  }, [token]);

  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return 0;
  };

  const loadPayouts = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const data = await paymentsApi.getPayoutHistory(token);
      setPayouts(data);
    } catch (err) {
      console.error('Failed to load payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPayouts();
    setRefreshing(false);
  };

  const getStatusBadge = (status: Payout['status']) => {
    const configs = {
      COMPLETED: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        label: 'COMPLETED',
        icon: CheckCircle,
      },
      PENDING: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        label: 'PENDING',
        icon: Clock,
      },
      APPROVED: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        label: 'APPROVED',
        icon: CheckCircle,
      },
      PROCESSING: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        label: 'PROCESSING',
        icon: RefreshCw,
      },
      REJECTED: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        label: 'REJECTED',
        icon: XCircle,
      },
      CANCELLED: {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        label: 'CANCELLED',
        icon: XCircle,
      },
      FAILED: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        label: 'FAILED',
        icon: AlertCircle,
      },
    };

    const config = configs[status] || configs.PENDING;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${config.bg}`}>
        <Icon className={`h-3.5 w-3.5 ${config.text}`} />
        <span className={`text-xs font-semibold uppercase ${config.text}`}>
          {config.label}
        </span>
      </div>
    );
  };

  const formatAccountNumber = (account: string | null) => {
    if (!account) return '••••';
    return `****${account.slice(-4)}`;
  };

  const handleViewReceipt = (payout: Payout) => {
    setSelectedPayout(payout);
  };

  const handleCloseReceipt = () => {
    setSelectedPayout(null);
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Payout Receipt - ${selectedPayout?.reference}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .receipt { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #043658; padding-bottom: 20px; }
                .logo { color: #043658; font-size: 24px; font-weight: bold; }
                .status { display: inline-block; padding: 8px 16px; border-radius: 20px; background: #10B981; color: white; font-weight: bold; margin-top: 10px; }
                .details { margin: 20px 0; }
                .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
                .label { font-weight: bold; color: #6b7280; }
                .value { color: #111827; }
                .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #043658; text-align: center; color: #6b7280; font-size: 12px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-gray-600">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading payouts...</span>
        </div>
      </div>
    );
  }

  const completedPayouts = payouts.filter(p => p.status === 'COMPLETED');
  const totalPaidOut = completedPayouts.reduce((sum, p) => sum + formatNumber(p.netAmount || p.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#043658]">Payout History</h1>
          <p className="text-gray-600 mt-1">Track all your withdrawal requests and transactions</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      {/* Summary Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Paid Out</h3>
            <div className="text-3xl font-bold text-[#043658]">
              {totalPaidOut.toFixed(2)} ETB
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completedPayouts.length} completed transaction{completedPayouts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="h-16 w-16 bg-[#043658]/5 rounded-full flex items-center justify-center">
            <Download className="h-8 w-8 text-[#043658]" />
          </div>
        </div>
      </Card>

      {/* Payouts List */}
      <div className="space-y-4">
        {payouts.length > 0 ? (
          payouts.map((payout) => (
            <Card key={payout.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getStatusBadge(payout.status)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1">
                      Ref: {payout.reference}
                    </div>
                    {payout.bankReference && (
                      <div className="text-xs text-gray-400">
                        Bank Reference: {payout.bankReference}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Bank Info */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Bank</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {payout.bankName || 'Bank ' + (payout.bankCode || '946')}
                  </div>
                </div>

                {/* Account */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Account</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatAccountNumber(payout.bankAccountNumber ?? null)}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Date</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {format(new Date(payout.completedAt || payout.createdAt), 'MMM dd, yyyy')}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Amount</div>
                  <div className="text-sm font-bold text-[#043658]">
                    {formatNumber(payout.netAmount || payout.amount).toFixed(2)} {payout.currency}
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              {payout.bankAccountName && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Bank Reference: TEST_BANK_REF_PAYOUT_{payout.reference.split('_')[1]}
                  </div>
                </div>
              )}

              {payout.completedAt && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Completed: {format(new Date(payout.completedAt), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              )}

              {payout.rejectionReason && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-red-600">
                    Rejection Reason: {payout.rejectionReason}
                  </div>
                </div>
              )}

              {/* Actions */}
              {payout.status === 'COMPLETED' && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleViewReceipt(payout)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#FDB714] text-white rounded-lg hover:bg-[#FDB714]/90 transition-colors text-sm font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    View Receipt
                  </button>
                </div>
              )}
            </Card>
          ))
        ) : (
          <Card>
            <div className="py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Download className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No payouts yet</h3>
              <p className="text-gray-600 mb-6">
                Your payout history will appear here once you request a withdrawal
              </p>
              <button
                onClick={() => window.location.href = '/dashboard/wallet'}
                className="px-6 py-2 bg-[#043658] text-white rounded-lg hover:bg-[#043658]/90 transition-colors"
              >
                Request Payout
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#043658]">Payment Receipt</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintReceipt}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Print Receipt"
                >
                  <Printer className="h-5 w-5 text-gray-600" />
                </button>
                <button
                  onClick={handleCloseReceipt}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Receipt Content */}
            <div ref={receiptRef} className="p-8">
              {/* Header */}
              <div className="text-center mb-8 border-b-2 border-[#043658] pb-6">
                <div className="text-3xl font-bold text-[#043658] mb-2">ServeLink</div>
                <div className="text-sm text-gray-600">Payment Receipt</div>
                <div className="mt-4">
                  {getStatusBadge(selectedPayout.status)}
                </div>
              </div>

              {/* Receipt Details */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Reference Number</span>
                  <span className="text-gray-900 font-mono">{selectedPayout.reference}</span>
                </div>

                {selectedPayout.bankReference && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Bank Reference</span>
                    <span className="text-gray-900 font-mono">{selectedPayout.bankReference}</span>
                  </div>
                )}

                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Date</span>
                  <span className="text-gray-900">
                    {format(new Date(selectedPayout.completedAt || selectedPayout.createdAt), 'MMMM dd, yyyy')}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Time</span>
                  <span className="text-gray-900">
                    {format(new Date(selectedPayout.completedAt || selectedPayout.createdAt), 'hh:mm a')}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Recipient</span>
                  <span className="text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Bank</span>
                  <span className="text-gray-900">
                    {selectedPayout.bankName || `Bank ${selectedPayout.bankCode || '946'}`}
                  </span>
                </div>

                <div className="flex justify-between py-3 border-b border-gray-200">
                  <span className="font-semibold text-gray-600">Account Number</span>
                  <span className="text-gray-900 font-mono">
                   {formatAccountNumber(selectedPayout.bankAccountNumber ?? null)}       
             </span>
                </div>

                {selectedPayout.bankAccountName && (
                  <div className="flex justify-between py-3 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Account Name</span>
                    <span className="text-gray-900">{selectedPayout.bankAccountName}</span>
                  </div>
                )}
              </div>

              {/* Amount Breakdown */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Amount Details</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross Amount</span>
                    <span className="text-gray-900">
                      {formatNumber(selectedPayout.amount).toFixed(2)} {selectedPayout.currency}
                    </span>
                  </div>

                  {selectedPayout.feeAmount && selectedPayout.feeAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction Fee</span>
                      <span className="text-red-600">
                        -{formatNumber(selectedPayout.feeAmount).toFixed(2)} {selectedPayout.currency}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-900">Net Amount</span>
                    <span className="text-lg font-bold text-[#043658]">
                      {formatNumber(selectedPayout.netAmount || selectedPayout.amount).toFixed(2)} {selectedPayout.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t-2 border-[#043658] text-sm text-gray-600">
                <p className="mb-2">Thank you for using ServeLink!</p>
                <p className="text-xs">
                  This is an electronically generated receipt. For any queries, please contact support@servelink.com
                </p>
                <p className="text-xs mt-2 text-gray-400">
                  Generated on {format(new Date(), 'MMMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={handleCloseReceipt}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="px-4 py-2 bg-[#043658] text-white rounded-lg hover:bg-[#043658]/90 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
