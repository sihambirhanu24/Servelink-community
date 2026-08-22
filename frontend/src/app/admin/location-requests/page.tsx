"use client";

import { useState } from "react";
import { useAdminLocationRequests } from "@/hooks/useAdminLocationRequests";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { LocationRequestDetailModal } from "@/components/admin/LocationRequestDetailModal";
import { Loader2, Eye, MapPin } from "lucide-react";

export default function LocationRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const { data: requests, isLoading } = useAdminLocationRequests(statusFilter === "ALL" ? undefined : statusFilter);

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="mt-16 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ml-0 lg:ml-64">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#043658]">Location Change Requests</h1>
                <p className="text-slate-500 text-sm mt-1">Review and manage teacher school transfer requests</p>
              </div>
              
              <div className="flex gap-2">
                {["PENDING", "APPROVED", "REJECTED", "ALL"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? "bg-[#043658] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Teacher</th>
                      <th className="px-6 py-4">Current Location</th>
                      <th className="px-6 py-4">Requested Location</th>
                      <th className="px-6 py-4">Submitted</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                        </td>
                      </tr>
                    ) : requests?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          No requests found.
                        </td>
                      </tr>
                    ) : (
                      requests?.map((req: any) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-medium text-[#043658]">
                              {req.teacher?.firstName} {req.teacher?.lastName}
                            </div>
                            <div className="text-xs text-slate-500">{req.teacher?.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-700">{req.currentSchool || 'No change'}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {req.currentRegion || 'No change'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-700 font-medium">{req.requestedSchool || 'No change'}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {req.requestedRegion || 'No change'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                              'bg-slate-100 text-slate-800'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedRequestId(req.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-[#043658] hover:bg-slate-200 text-sm font-medium transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      <LocationRequestDetailModal
        requestId={selectedRequestId}
        isOpen={!!selectedRequestId}
        onClose={() => setSelectedRequestId(null)}
      />
    </div>
  );
}
