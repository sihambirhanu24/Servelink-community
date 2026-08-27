"use client";

import React, { useState } from "react";
import { Shield, Eye, EyeOff, Lock, Loader2 } from "lucide-react";
import { changePassword } from "@/services/profile";
import { toast } from "sonner";

export default function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isLengthValid = newPassword.length >= 8;
  const isDifferent = newPassword && currentPassword !== newPassword;
  const isMatching = newPassword && newPassword === confirmPassword;
  const isValid = !!currentPassword && isLengthValid && isDifferent && isMatching;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    try {
      setIsLoading(true);
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Unable to change password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthIndicator = () => {
    if (!newPassword) return null;
    let strength = 0;
    if (newPassword.length > 7) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;

    const strengthText = strength <= 2 ? "Weak" : strength === 3 ? "Fair" : "Strong";
    const strengthColor =
      strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-yellow-500" : "bg-green-500";
    const percent = (strength / 4) * 100;

    return (
      <div className="mt-2">
        <div className="flex justify-between text-xs mb-1 text-gray-500">
          <span>Password strength</span>
          <span className="font-medium">{strengthText}</span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strengthColor} transition-all duration-300`}
            style={{ width: `${Math.max(25, percent)}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <Shield className="w-5 h-5 text-[#043658]" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Account Security</h2>
          <p className="text-sm text-gray-500">Protect your ServeLink account</p>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-6">
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-[#043658] focus:border-[#043658] sm:text-sm transition-colors"
                placeholder="Enter your current password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-[#043658] focus:border-[#043658] sm:text-sm transition-colors"
                placeholder="Minimum 8 characters"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {getStrengthIndicator()}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-[#043658] focus:border-[#043658] sm:text-sm transition-colors"
                placeholder="Repeat new password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {!isMatching && confirmPassword && (
              <p className="text-red-500 text-xs mt-1">New passwords do not match.</p>
            )}
            {!isLengthValid && newPassword && (
              <p className="text-red-500 text-xs mt-1">Minimum 8 characters required.</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isValid || isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#043658] hover:bg-[#032840] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#043658] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Change Password"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
