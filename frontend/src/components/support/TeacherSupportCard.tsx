"use client";

import { useState } from "react";
import { Handshake, MessageCircle, Users, Star } from "lucide-react";
import { useDashboardStats, useProviderStats } from "@/hooks/useSupport";
import { RequestSupportModal } from "./RequestSupportModal";
import { OfferSupportModal } from "./OfferSupportModal";
import { useRouter } from "next/navigation";

export function TeacherSupportCard() {
  const router = useRouter();
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);

  const { data: dashboardStats } = useDashboardStats();
  const { data: providerStats } = useProviderStats();

  const handleViewProviders = () => {
    router.push("/support");
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-[#043658]/10 flex items-center justify-center">
            <Handshake className="w-4 h-4 text-[#043658]" />
          </div>
          <h3 className="font-bold text-[#043658] text-sm">Teacher Support</h3>
        </div>

        {/* Stats */}
        {dashboardStats && (
          <div className="mb-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Connect with mentors or offer your expertise to peers in the network.
            </p>
            <div className="flex items-center gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#043658]" />
                <span className="text-slate-700 font-semibold">
                  {dashboardStats.availableProviders}
                </span>
                <span className="text-slate-500">available</span>
              </div>
              {providerStats?.isProvider && (
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#FFC107]" />
                  <span className="text-slate-700 font-semibold">
                    {providerStats.averageRating?.toFixed(1) || "N/A"}
                  </span>
                  <span className="text-slate-500">rating</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Provider Status */}
        {providerStats?.isProvider && (
          <div className="mb-4 p-3 bg-[#043658]/5 rounded-lg">
            <p className="text-xs text-[#043658] font-semibold mb-1">
              You're a provider!
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span>{providerStats.completedSessions} completed</span>
              <span>•</span>
              <span>{providerStats.activeRequests} active</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={() => setRequestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#043658] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#032a44] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Request Support
          </button>
          <button
            onClick={() => setOfferModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-white text-[#043658] border border-slate-200 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Handshake className="w-4 h-4" />
            {providerStats?.isProvider ? "Manage Profile" : "Offer Support"}
          </button>
          <button
            onClick={handleViewProviders}
            className="w-full flex items-center justify-center gap-2 bg-white text-slate-700 border border-slate-200 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            <Users className="w-4 h-4" />
            Browse Providers
          </button>
        </div>
      </div>

      {/* Modals */}
      <RequestSupportModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
      />
      <OfferSupportModal
        isOpen={offerModalOpen}
        onClose={() => setOfferModalOpen(false)}
      />
    </>
  );
}
