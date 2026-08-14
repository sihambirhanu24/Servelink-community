"use client";

import { useState } from "react";
import { changePassword } from "@/services/profile";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Lock, 
  Shield, 
  CheckCircle2, 
  XCircle,
  Loader2,
  KeyRound
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0;
  
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  
  if (score <= 2) return { score: 1, label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-500' };
  if (score <= 4) return { score: 2, label: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-500' };
  if (score <= 5) return { score: 3, label: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
  return { score: 4, label: 'Strong', color: 'text-emerald-600', bgColor: 'bg-emerald-500' };
}

export default function ChangePasswordPage() {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = calculatePasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordsDontMatch = confirmPassword && newPassword !== confirmPassword;

  const requirements = [
    { met: newPassword.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(newPassword), label: 'One uppercase letter' },
    { met: /[a-z]/.test(newPassword), label: 'One lowercase letter' },
    { met: /[0-9]/.test(newPassword), label: 'One number' },
    { met: /[^a-zA-Z0-9]/.test(newPassword), label: 'One special character' },
  ];

  const canSubmit = oldPassword && newPassword.length >= 8 && passwordsMatch;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!canSubmit) {
      toast.error("Please fill all fields correctly");
      return;
    }

    try {
      setLoading(true);
      await changePassword(oldPassword, newPassword);
      toast.success("Password changed successfully!");
      router.push("/profile");
    } catch (error: any) {
      console.log("Change Password Error:", error);
      const errorMessage = error.response?.data?.message || "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#043658] via-[#043658]/95 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Header Card */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/profile">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
          </Link>
          <div>
            <h1 className="font-['Lexend'] text-2xl font-bold text-white">
              Change Password
            </h1>
            <p className="text-sm text-slate-300">
              Keep your account secure
            </p>
          </div>
        </div>

        {/* Main Form Card */}
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-8 shadow-2xl"
        >
          {/* Security Badge */}
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-gradient-to-br from-[#FFC107] to-amber-400 p-4">
              <Shield className="h-8 w-8 text-[#043658]" />
            </div>
          </div>

          {/* Current Password */}
          <div className="mb-5">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Lock className="h-4 w-4 text-[#043658]" />
              Current Password
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? "text" : "password"}
                placeholder="Enter your current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                onFocus={() => setFocusedField('old')}
                onBlur={() => setFocusedField(null)}
                className={`w-full rounded-xl border-2 bg-slate-50 p-3.5 pr-12 text-sm text-slate-700 transition-all focus:outline-none ${
                  focusedField === 'old'
                    ? 'border-[#043658] bg-white ring-4 ring-[#043658]/10'
                    : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#043658]"
              >
                {showOldPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="mb-3">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <KeyRound className="h-4 w-4 text-[#043658]" />
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onFocus={() => setFocusedField('new')}
                onBlur={() => setFocusedField(null)}
                className={`w-full rounded-xl border-2 bg-slate-50 p-3.5 pr-12 text-sm text-slate-700 transition-all focus:outline-none ${
                  focusedField === 'new'
                    ? 'border-[#043658] bg-white ring-4 ring-[#043658]/10'
                    : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#043658]"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    Password Strength:
                  </span>
                  <span className={`text-xs font-bold ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                    transition={{ duration: 0.3 }}
                    className={`h-full ${passwordStrength.bgColor} rounded-full`}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Requirements Checklist */}
          {newPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 rounded-xl bg-slate-50 p-4"
            >
              <p className="mb-2 text-xs font-semibold text-slate-600">Password Requirements:</p>
              <div className="space-y-1.5">
                {requirements.map((req, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2"
                  >
                    {req.met ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-300" />
                    )}
                    <span className={`text-xs ${req.met ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                      {req.label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirm Password */}
          <div className="mb-6">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <KeyRound className="h-4 w-4 text-[#043658]" />
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField('confirm')}
                onBlur={() => setFocusedField(null)}
                className={`w-full rounded-xl border-2 bg-slate-50 p-3.5 pr-12 text-sm text-slate-700 transition-all focus:outline-none ${
                  focusedField === 'confirm'
                    ? passwordsMatch
                      ? 'border-emerald-500 bg-white ring-4 ring-emerald-500/10'
                      : passwordsDontMatch
                      ? 'border-red-500 bg-white ring-4 ring-red-500/10'
                      : 'border-[#043658] bg-white ring-4 ring-[#043658]/10'
                    : passwordsMatch
                    ? 'border-emerald-200'
                    : passwordsDontMatch
                    ? 'border-red-200'
                    : 'border-slate-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#043658]"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            
            {/* Match Feedback */}
            {confirmPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2"
              >
                {passwordsMatch ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="font-medium">Passwords match!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-red-600">
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="font-medium">Passwords don't match</span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: canSubmit ? 1.02 : 1 }}
            whileTap={{ scale: canSubmit ? 0.98 : 1 }}
            disabled={!canSubmit || loading}
            type="submit"
            className={`w-full rounded-xl py-3.5 font-semibold text-white transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-[#043658] to-[#043658]/90 hover:shadow-lg'
                : 'cursor-not-allowed bg-slate-300'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Updating Password...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                Change Password
              </span>
            )}
          </motion.button>

          {/* Help Text */}
          <p className="mt-4 text-center text-xs text-slate-500">
            Make sure your new password is strong and unique
          </p>
        </motion.form>
      </motion.div>
    </main>
  );
}