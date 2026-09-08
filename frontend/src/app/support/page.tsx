"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Users,
  Loader2,
  Inbox,
  MessageCircle,
  Video,
  FileText,
  UserPlus,
  DollarSign,
} from "lucide-react";
import { useDiscoverProviders, useDashboardStats } from "@/hooks/useSupport";
import { ProviderCard } from "@/components/support/ProviderCard";
import { RequestSupportModal } from "@/components/support/RequestSupportModal";
import { OfferSupportModal } from "@/components/support/OfferSupportModal";
import type { SupportType } from "@/services/support";
import { useAuth } from "@/context/AuthContext";
import { financialSupportApi, FinancialSupportRequest } from "@/services/financial-support";
import FinancialSupportCard from "@/components/support/FinancialSupportCard";
import CreateFinancialSupportModal from "@/components/support/CreateFinancialSupportModal";
import ContributeModal from "@/components/support/ContributeModal";
import { toast } from "sonner";
import { walletApi } from "@/services/wallet";

const SUPPORT_TYPE_FILTERS: {
  value: SupportType | "FINANCIAL" | "";
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "", label: "All Types", icon: <Filter className="h-4 w-4" /> },
  { value: "CHAT", label: "Chat", icon: <MessageCircle className="h-4 w-4" /> },
  {
    value: "LIVE_SESSION",
    label: "Live Session",
    icon: <Video className="h-4 w-4" />,
  },
  { value: "RESOURCE", label: "Resources", icon: <FileText className="h-4 w-4" /> },
  { value: "MENTORSHIP", label: "Mentorship", icon: <Users className="h-4 w-4" /> },
  { value: "FINANCIAL", label: "Financial Support", icon: <DollarSign className="h-4 w-4" /> },
];

export default function SupportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [supportTypeFilter, setSupportTypeFilter] = useState<SupportType | "FINANCIAL" | "">("");
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<
    string | undefined
  >();
  
  // Financial Support State
  const [financialRequests, setFinancialRequests] = useState<FinancialSupportRequest[]>([]);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [createFinancialModalOpen, setCreateFinancialModalOpen] = useState(false);
  const [contributeModalOpen, setContributeModalOpen] = useState(false);
  const [selectedFinancialRequest, setSelectedFinancialRequest] = useState<FinancialSupportRequest | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loadingBalance, setLoadingBalance] = useState(false);

  const { data: stats } = useDashboardStats();
  const { data: providersData, isLoading } = useDiscoverProviders({
    search: searchTerm || undefined,
    supportType: supportTypeFilter === "FINANCIAL" ? undefined : (supportTypeFilter || undefined),
    isAvailable: true,
    page: 1,
    limit: 20,
  });

  // Fetch financial requests when FINANCIAL filter is selected
  useEffect(() => {
    if (supportTypeFilter === "FINANCIAL") {
      fetchFinancialRequests();
      fetchWalletBalance();
    }
  }, [supportTypeFilter]);

  const fetchFinancialRequests = async () => {
    setFinancialLoading(true);
    try {
      const response = await financialSupportApi.getRequests({
        status: undefined, // Show all open requests
        page: 1,
        limit: 20,
      });
      setFinancialRequests(response.requests);
    } catch (error) {
      console.error("Failed to fetch financial requests:", error);
      toast.error("Failed to load financial support requests");
    } finally {
      setFinancialLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    if (!user) {
      console.log("User not authenticated, skipping wallet balance fetch");
      setWalletBalance(0);
      return 0;
    }
    
    setLoadingBalance(true);
    try {
      console.log("Fetching wallet balance for user:", user.sub);
      const balance = await walletApi.getBalance();
      console.log("Raw balance response:", balance);
      const availableBalance = Number(balance.availableBalance);
      console.log("Parsed available balance:", availableBalance);
      setWalletBalance(availableBalance);
      setLoadingBalance(false);
      return availableBalance;
    } catch (error: any) {
      console.error("Failed to fetch wallet balance:", error);
      console.error("Error response:", error.response?.data);
      toast.error("Failed to load wallet balance. Please try again.");
      setWalletBalance(0);
      setLoadingBalance(false);
      return 0;
    }
  };

  const handleRequestSupport = (providerId?: string) => {
    setSelectedProviderId(providerId);
    setRequestModalOpen(true);
  };

  const handleCloseRequestModal = () => {
    setRequestModalOpen(false);
    setSelectedProviderId(undefined);
  };

  const handleContribute = (request: FinancialSupportRequest) => {
    if (!user) {
      toast.error("Please log in to contribute");
      return;
    }
    
    setSelectedFinancialRequest(request);
    setContributeModalOpen(true);
  };

  const handleContributeSuccess = () => {
    fetchFinancialRequests();
    fetchWalletBalance();
    setContributeModalOpen(false);
    setSelectedFinancialRequest(null);
  };

  const handleCreateFinancialSuccess = () => {
    fetchFinancialRequests();
    setCreateFinancialModalOpen(false);
  };

  const isShowingFinancialRequests = supportTypeFilter === "FINANCIAL";

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Teacher Support
              </h1>
              <p className="text-slate-600 mt-1">
                Connect with mentors or offer your expertise
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/support/dashboard')}
                className="px-4 py-2 text-sm font-semibold text-[#043658] border-2 border-[#043658] rounded-xl hover:bg-[#043658]/5 transition-colors"
              >
                <Inbox className="h-4 w-4 inline mr-2" />
                My Requests
              </button>
              <button
                onClick={() => setOfferModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#FFC107] rounded-xl hover:bg-[#FFC107]/90 transition-colors"
              >
                <UserPlus className="h-4 w-4 inline mr-2" />
                Offer Support
              </button>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-[#043658]/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-[#043658]">
                  {stats.availableProviders}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Available Providers
                </div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-emerald-700">
                  {stats.totalProviders}
                </div>
                <div className="text-xs text-slate-600 mt-1">Total Providers</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-amber-700">
                  {stats.activeRequests}
                </div>
                <div className="text-xs text-slate-600 mt-1">Active Requests</div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-purple-700">
                  {stats.totalRequests}
                </div>
                <div className="text-xs text-slate-600 mt-1">Total Requests</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by expertise or name..."
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Support Type Filters */}
          <div className="flex flex-wrap gap-2">
            {SUPPORT_TYPE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSupportTypeFilter(filter.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all border-2 ${
                  supportTypeFilter === filter.value
                    ? "border-[#043658] bg-[#043658]/5 text-[#043658]"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {filter.icon}
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Providers Grid or Financial Requests */}
        {isShowingFinancialRequests ? (
          // Financial Support Requests Section
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-slate-600">
                {financialLoading ? "Loading..." : `${financialRequests.length} active request${financialRequests.length !== 1 ? "s" : ""}`}
              </div>
              <button
                onClick={() => setCreateFinancialModalOpen(true)}
                className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors"
              >
                <DollarSign className="h-4 w-4 inline mr-2" />
                Request Financial Support
              </button>
            </div>

            {financialLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
              </div>
            ) : financialRequests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {financialRequests.map((request) => (
                  <FinancialSupportCard
                    key={request.id}
                    request={request}
                    onContribute={handleContribute}
                    currentUserId={user?.sub || ""}
                    isOwner={request.requesterId === user?.sub}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No financial support requests yet
                </h3>
                <p className="text-slate-600 mb-6">
                  Be the first to request financial support from the community
                </p>
                <button
                  onClick={() => setCreateFinancialModalOpen(true)}
                  className="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                >
                  Request Financial Support
                </button>
              </div>
            )}
          </>
        ) : (
          // Original Providers Section
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
              </div>
            ) : providersData && providersData.data.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-slate-600">
                  Found {providersData.meta.total} provider
                  {providersData.meta.total !== 1 ? "s" : ""}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {providersData.data.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      onRequestSupport={handleRequestSupport}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No providers found
                </h3>
                <p className="text-slate-600 mb-6">
                  {searchTerm || supportTypeFilter
                    ? "Try adjusting your search or filters"
                    : "Be the first to offer support!"}
                </p>
                {!searchTerm && !supportTypeFilter && (
                  <button
                    onClick={() => setOfferModalOpen(true)}
                    className="px-6 py-3 bg-[#043658] text-white font-semibold rounded-xl hover:bg-[#043658]/90 transition-colors"
                  >
                    Offer Support
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <RequestSupportModal
        isOpen={requestModalOpen}
        onClose={handleCloseRequestModal}
        providerId={selectedProviderId}
      />
      <OfferSupportModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
      />
      <CreateFinancialSupportModal
        isOpen={createFinancialModalOpen}
        onClose={() => setCreateFinancialModalOpen(false)}
        onSuccess={handleCreateFinancialSuccess}
      />
      {selectedFinancialRequest && (
        <ContributeModal
          isOpen={contributeModalOpen}
          onClose={() => {
            setContributeModalOpen(false);
            setSelectedFinancialRequest(null);
          }}
          request={selectedFinancialRequest}
          onSuccess={handleContributeSuccess}
        />
      )}
    </div>
  );
}
