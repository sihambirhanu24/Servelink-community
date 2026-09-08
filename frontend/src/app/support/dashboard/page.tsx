"use client";

import { useState } from "react";
import {
  Inbox,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageCircle,
  Star,
  Settings,
  FileText,
  DollarSign,
} from "lucide-react";
import {
  useMySupportRequests,
  useProviderRequests,
  useMyProviderProfile,
  useProviderStats,
  useAcceptSupportRequest,
  useDeclineSupportRequest,
  useCompleteSupportRequest,
  useCancelSupportRequest,
} from "@/hooks/useSupport";
import { OfferSupportModal } from "@/components/support/OfferSupportModal";
import { RequestSupportModal } from "@/components/support/RequestSupportModal";
import type {
  SupportRequest,
  SupportRequestStatus,
} from "@/services/support";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUS_TABS: { value: SupportRequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_COLORS: Record<SupportRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-100 text-slate-700",
};

function RequestCard({
  request,
  isProvider,
  onAccept,
  onDecline,
  onComplete,
  onCancel,
  onOpenChat,
}: {
  request: SupportRequest;
  isProvider: boolean;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  onOpenChat?: (id: string) => void;
}) {
  const otherParty = isProvider ? request.requester : request.provider?.teacher;
  const otherName = otherParty
    ? `${otherParty.firstName} ${otherParty.lastName}`
    : "Unknown";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-slate-900 mb-1">{request.topic}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">
            {request.description}
          </p>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[request.status]}`}
        >
          {request.status.replace("_", " ")}
        </span>
      </div>

      {/* Payment Info (if PAID) */}
      {request.paymentType === "PAID" && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-700" />
              <span className="text-sm font-semibold text-amber-900">
                Paid Support
              </span>
            </div>
            <span className="text-lg font-bold text-amber-900">
              {request.requestedAmount?.toFixed(2)} ETB
            </span>
          </div>
          {request.paymentReason && (
            <p className="text-xs text-amber-800 mt-1">
              {request.paymentReason}
            </p>
          )}
          {request.paymentStatus && (
            <div className="mt-2 flex items-center gap-1">
              <span className="text-xs text-amber-700">Payment:</span>
              <span className={`text-xs font-semibold ${
                request.paymentStatus === "RESERVED" ? "text-amber-700" :
                request.paymentStatus === "TRANSFERRED" ? "text-emerald-700" :
                request.paymentStatus === "RELEASED" ? "text-slate-600" :
                "text-slate-600"
              }`}>
                {request.paymentStatus.replace("_", " ")}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Meta Info */}
      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span>{isProvider ? "From" : "To"}: {otherName}</span>
        <span>•</span>
        <span>{request.supportType.replace("_", " ")}</span>
        <span>•</span>
        <span className="capitalize">{request.urgency.toLowerCase()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isProvider && request.status === "PENDING" && (
          <>
            <button
              onClick={() => onAccept?.(request.id)}
              className="flex-1 px-4 py-2 bg-[#043658] text-white text-sm font-semibold rounded-lg hover:bg-[#043658]/90 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => onDecline?.(request.id)}
              className="px-4 py-2 border-2 border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Decline
            </button>
          </>
        )}

        {isProvider &&
          (request.status === "ACCEPTED" || request.status === "IN_PROGRESS") && (
            <button
              onClick={() => onComplete?.(request.id)}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </button>
          )}

        {!isProvider &&
          (request.status === "PENDING" || request.status === "ACCEPTED") && (
            <button
              onClick={() => onCancel?.(request.id)}
              className="px-4 py-2 border-2 border-rose-200 text-rose-700 text-sm font-semibold rounded-lg hover:bg-rose-50 transition-colors"
            >
              Cancel
            </button>
          )}

        {(request.status === "ACCEPTED" ||
          request.status === "IN_PROGRESS" ||
          request.status === "COMPLETED") &&
          request.chatRoomId && (
            <button
              onClick={() => onOpenChat?.(request.chatRoomId!)}
              className="flex-1 px-4 py-2 border-2 border-[#043658] text-[#043658] text-sm font-semibold rounded-lg hover:bg-[#043658]/5 transition-colors flex items-center justify-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Open Chat
            </button>
          )}

        {!isProvider && request.status === "COMPLETED" && !request.rating && (
          <Link
            href={`/support/rate/${request.id}`}
            className="flex-1 px-4 py-2 bg-[#FFC107] text-white text-sm font-semibold rounded-lg hover:bg-[#FFC107]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Star className="h-4 w-4" />
            Rate Support
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SupportDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"MY_REQUESTS" | "PROVIDER_REQUESTS">(
    "MY_REQUESTS",
  );
  const [statusFilter, setStatusFilter] = useState<SupportRequestStatus | "ALL">(
    "ALL",
  );
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const { data: providerProfile } = useMyProviderProfile();
  const { data: providerStats } = useProviderStats();

  const myRequestsQuery = useMySupportRequests({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const providerRequestsQuery = useProviderRequests({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
  });

  const acceptRequest = useAcceptSupportRequest();
  const declineRequest = useDeclineSupportRequest();
  const completeRequest = useCompleteSupportRequest();
  const cancelRequest = useCancelSupportRequest();

  const currentData =
    activeTab === "MY_REQUESTS"
      ? myRequestsQuery.data
      : providerRequestsQuery.data;
  const isLoading =
    activeTab === "MY_REQUESTS"
      ? myRequestsQuery.isLoading
      : providerRequestsQuery.isLoading;

  const handleOpenChat = (chatRoomId: string) => {
    router.push(`/chat?room=${chatRoomId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Support Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your support requests and offerings
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/support"
                className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <FileText className="h-4 w-4 inline mr-2" />
                Discover Providers
              </Link>
              <button
                onClick={() => setRequestModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#043658] rounded-xl hover:bg-[#043658]/90 transition-colors"
              >
                Request Support
              </button>
            </div>
          </div>

          {/* Provider Stats */}
          {providerStats?.isProvider && (
            <div className="bg-[#043658]/5 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-[#043658]">Your Provider Profile</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {providerStats.isAvailable ? "Currently available" : "Unavailable"}
                  </p>
                </div>
                <button
                  onClick={() => setOfferModalOpen(true)}
                  className="px-4 py-2 text-sm font-semibold text-[#043658] border-2 border-[#043658] rounded-xl hover:bg-[#043658]/5 transition-colors flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage Profile
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-[#043658]">
                    {providerStats.completedSessions}
                  </div>
                  <div className="text-xs text-slate-600">Completed Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#043658]">
                    {providerStats.activeRequests}
                  </div>
                  <div className="text-xs text-slate-600">Active Requests</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#043658]">
                    {providerStats.averageRating?.toFixed(1) || "N/A"}
                  </div>
                  <div className="text-xs text-slate-600">Average Rating</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("MY_REQUESTS")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "MY_REQUESTS"
                ? "bg-[#043658] text-white"
                : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <Inbox className="h-4 w-4 inline mr-2" />
            My Requests
          </button>
          {providerStats?.isProvider && (
            <button
              onClick={() => setActiveTab("PROVIDER_REQUESTS")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === "PROVIDER_REQUESTS"
                  ? "bg-[#043658] text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Requests for Me
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border-2 ${
                statusFilter === tab.value
                  ? "border-[#043658] bg-[#043658]/5 text-[#043658]"
                  : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
          </div>
        ) : currentData && currentData.data.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {currentData.data.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                isProvider={activeTab === "PROVIDER_REQUESTS"}
                onAccept={(id) => acceptRequest.mutate(id)}
                onDecline={(id) => declineRequest.mutate(id)}
                onComplete={(id) => completeRequest.mutate(id)}
                onCancel={(id) => cancelRequest.mutate(id)}
                onOpenChat={handleOpenChat}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No requests found
            </h3>
            <p className="text-slate-600">
              {statusFilter !== "ALL"
                ? `No ${statusFilter.toLowerCase().replace("_", " ")} requests`
                : "You don't have any support requests yet"}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <OfferSupportModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
      />
      <RequestSupportModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
    </div>
  );
}
