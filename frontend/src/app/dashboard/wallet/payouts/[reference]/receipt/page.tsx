'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { paymentsApi, Payout } from '@/services/payments';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, CheckCircle, Receipt, Download, Printer, Calendar, Wallet, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export default function PayoutReceiptPage() {
  const { reference } = useParams<{ reference: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [payout, setPayout] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token && reference) {
      loadPayout();
    }
  }, [token, reference]);

  const loadPayout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get payout history and find by reference
      const payoutHistory = await paymentsApi.getPayoutHistory(token!);
      const foundPayout = payoutHistory.find(p => p.reference === reference);
      
      if (!foundPayout) {
        setError('Payout not found');
        return;
      }

      if (foundPayout.status !== 'COMPLETED') {
        setError('Receipt is only available for completed payouts');
        return;
      }

      setPayout(foundPayout);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load payout receipt');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value);
    if (value && typeof value.toNumber === 'function') return value.toNumber();
    return 0;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Simple download by printing to PDF
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading receipt...</div>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-[#FFC107] text-[#043658] hover:bg-yellow-400 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error || 'Payout not found'}</p>
        </div>
      </div>
    );
  }

  const amount = formatNumber(payout.amount);
  const platformFeePercent = 15; // This should come from wallet data
  const fee = amount * (platformFeePercent / 100);
  const netAmount = amount - fee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-[#FFC107] text-[#043658] hover:bg-yellow-400 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-[#FFC107] text-[#043658] hover:bg-yellow-400 flex items-center gap-2"
          >
            <Download className="h-4 w-4" /> Download
          </button>
          <button
            onClick={handlePrint}
            className="rounded-xl px-5 py-3 font-semibold transition duration-300 bg-[#FFC107] text-[#043658] hover:bg-yellow-400 flex items-center gap-2"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Receipt Card */}
      <Card className="max-w-3xl mx-auto">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Receipt className="h-8 w-8 text-[#043658]" />
              <h1 className="text-2xl font-bold text-[#043658]">ServeLink</h1>
            </div>
            <h2 className="text-xl font-semibold text-gray-700">Payout Receipt</h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-600 font-medium">COMPLETED</span>
            </div>
          </div>

          {/* Payout Details */}
          <div className="space-y-6">
            {/* Reference */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payout Reference</p>
                <p className="font-mono text-sm font-semibold text-[#043658]">{payout.reference}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Chapa Reference</p>
                <p className="font-mono text-sm font-semibold text-[#043658]">{payout.chapaReference || 'N/A'}</p>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-700">Bank Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Bank</p>
                  <p className="font-medium">{payout.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Account</p>
                  <p className="font-medium">****{payout.bankAccountNumber?.slice(-4)}</p>
                </div>
              </div>
            </div>

            {/* Amount Details */}
            <div className="bg-[#043658]/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="h-5 w-5 text-[#043658]" />
                <h3 className="font-semibold text-gray-700">Amount Details</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested Amount</span>
                  <span className="font-medium">{amount.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee ({platformFeePercent}%)</span>
                  <span className="font-medium text-red-600">-{fee.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-700">Net Amount</span>
                  <span className="font-bold text-[#043658]">{netAmount.toFixed(2)} ETB</span>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Requested Date
                </p>
                <p className="font-medium">{format(new Date(payout.createdAt), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Completed Date
                </p>
                <p className="font-medium">{payout.completedAt ? format(new Date(payout.completedAt), 'MMM dd, yyyy HH:mm') : 'N/A'}</p>
              </div>
            </div>

            {/* Bank Reference */}
            {payout.bankReference && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Bank Reference</p>
                <p className="font-mono text-sm font-semibold text-green-700">{payout.bankReference}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>This receipt confirms that your payout has been successfully processed.</p>
            <p className="mt-1">For questions, contact ServeLink support.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
