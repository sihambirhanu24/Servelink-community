"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User as UserIcon, LogOut, AlertTriangle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Topbar from "@/components/layout/Topbar";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import PasswordChangeCard from "@/components/settings/PasswordChangeCard";
import NotificationPreferencesCard from "@/components/settings/NotificationPreferencesCard";
import LogoutConfirmationModal from "@/components/settings/LogoutConfirmationModal";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, isInitializing } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Return empty or a skeleton while auth is loading to prevent flashing
  if (isInitializing) return null;
  if (!user) {
    // If not logged in, they shouldn't be here, but just in case
    router.replace("/auth/login");
    return null;
  }

  const isSuspended = user.status === "SUSPENDED" || user.status === "PERMANENTLY_SUSPENDED";

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500">Manage your ServeLink account and preferences</p>
            </div>
          </div>
          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

        {/* Suspension Banner */}
        {isSuspended && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-800">Account status: Suspended</h3>
              <p className="text-sm text-red-700 mt-1">
                Your account currently has restricted access. Some settings may be disabled.
              </p>
              <Link 
                href="/support"
                className="inline-block mt-2 text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Contact Administrator &rarr;
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-8 space-y-8">
            <PasswordChangeCard />
            <NotificationPreferencesCard />
          </div>

          {/* Side Column */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Account Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-[#043658]" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Name</p>
                  <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Role</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">Teacher</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Teacher Level</p>
                  <p className="text-sm font-medium text-gray-900">{user.level?.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Verification</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      user.verified 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {user.verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <Link 
                    href="/profile"
                    className="flex items-center justify-between text-sm font-medium text-[#043658] hover:text-[#032840] group"
                  >
                    View full profile
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
        </div>
      </main>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={() => {
          setIsLogoutModalOpen(false);
          logout();
        }}
      />
    </div>
  );
}
