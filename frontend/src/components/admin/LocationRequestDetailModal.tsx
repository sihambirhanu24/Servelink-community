import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApproveLocationRequest, useRejectLocationRequest } from '@/hooks/useAdminLocationRequests';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Loader2, X, MapPin, Download, CheckCircle, XCircle } from 'lucide-react';

export function LocationRequestDetailModal({
  requestId,
  isOpen,
  onClose,
}: {
  requestId: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: request, isLoading } = useQuery({
    queryKey: ['location-request', requestId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/location-change-requests/${requestId}`);
      return data;
    },
    enabled: !!requestId && isOpen,
  });

  const { mutateAsync: approveRequest, isPending: isApproving } = useApproveLocationRequest();
  const { mutateAsync: rejectRequest, isPending: isRejectingMutation } = useRejectLocationRequest();

  if (!isOpen || !requestId) return null;

  async function handleApprove() {
    if (!confirm('Are you sure you want to approve this location change? The teacher\'s official location and community access will be updated.')) return;
    try {
      await approveRequest(requestId!);
      toast.success('Request approved successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    }
  }

  async function handleReject() {
    if (!rejectReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    try {
      await rejectRequest({ id: requestId!, reason: rejectReason });
      toast.success('Request rejected successfully');
      setIsRejecting(false);
      setRejectReason('');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    }
  }

  async function handleDownloadDoc() {
    try {
      const response = await api.get(`/admin/location-change-requests/documents/${requestId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', request.fileName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error('Failed to download document');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <h2 className="text-xl font-semibold text-[#043658]">Review Location Change Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex py-12 justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : request ? (
            <div className="space-y-6">
              
              {/* Teacher Info */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Teacher Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Name</div>
                    <div className="font-medium text-[#043658]">{request.teacher?.firstName} {request.teacher?.lastName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Email</div>
                    <div className="font-medium text-[#043658]">{request.teacher?.email}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Level</div>
                    <div className="font-medium text-[#043658]">{request.teacher?.level.replace('_', ' ')}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Subject</div>
                    <div className="font-medium text-[#043658]">{request.teacher?.subject || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Location Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" /> Current Location
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-slate-500">School</div>
                      <div className="font-medium">{request.currentSchool || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Woreda</div>
                      <div className="font-medium">{request.currentWoreda || 'N/A'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Zone / Region</div>
                      <div className="font-medium">{request.currentZone || 'N/A'} / {request.currentRegion || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#043658]/20 bg-[#043658]/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-[#043658] text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg">NEW</div>
                  <h3 className="text-sm font-semibold text-[#043658] mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#043658]" /> Requested Changes
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-[#043658]/60">School</div>
                      <div className="font-medium text-[#043658]">{request.requestedSchool || 'No change'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#043658]/60">Woreda</div>
                      <div className="font-medium text-[#043658]">{request.requestedWoreda || 'No change'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#043658]/60">Zone / Region</div>
                      <div className="font-medium text-[#043658]">{request.requestedZone || 'No change'} / {request.requestedRegion || 'No change'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[#043658]/60">Subject</div>
                      <div className="font-medium text-[#043658]">{request.requestedSubject || 'No change'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Reason for Change</h3>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 whitespace-pre-wrap">
                  {request.reason}
                </div>
              </div>

              {/* Document */}
              {request.fileName ? (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Supporting Document</h3>
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Download className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">{request.fileName}</div>
                        <div className="text-xs text-slate-500">{(request.fileSize / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <button
                      onClick={handleDownloadDoc}
                      className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-[#043658] shadow-sm border border-slate-200 hover:bg-slate-50"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Supporting Document</h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 italic">
                    No supporting document provided.
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {request.status === 'PENDING' && (
                <div className="pt-4 border-t border-slate-100">
                  {isRejecting ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-slate-700">Rejection Reason</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        placeholder="Explain why this request is being rejected..."
                        rows={3}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setIsRejecting(false)}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={isRejectingMutation}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
                        >
                          {isRejectingMutation && <Loader2 className="h-4 w-4 animate-spin" />}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setIsRejecting(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Request
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={isApproving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm font-medium transition-colors"
                      >
                        {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Approve Request
                      </button>
                    </div>
                  )}
                </div>
              )}
              
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">Request not found</div>
          )}
        </div>
      </div>
    </div>
  );
}
