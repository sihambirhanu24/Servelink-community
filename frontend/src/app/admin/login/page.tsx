'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader, Lock } from 'lucide-react';
import { adminLogin } from '@/services/auth';
import { DashboardSidebar } from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await adminLogin(email, password);
      console.log('Login result:', result);
      
      if (result.admin && result.accessToken) {
        // Wait a moment for cookie and localStorage to be set
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Success - redirect to admin dashboard
        console.log('Navigating to /admin');
        router.push('/admin');
      } else {
        setError('Login response incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar />
      <Topbar />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Card Container */}
          <div className="rounded-2xl border border-[#D9E2EC] bg-white p-8 shadow-sm">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658]">
                <Lock className="h-6 w-6 text-[#FFC107]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#043658]">Admin Access</h1>
                <p className="mt-1 text-sm text-[#6B7C93]">
                  Enter your credentials to access the admin dashboard
                </p>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 flex gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-[#043658] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@servelink.et"
                  required
                  className="w-full rounded-lg border border-[#D9E2EC] px-4 py-2.5 text-sm text-[#043658] placeholder:text-[#6B7C93] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
                />
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-[#043658] mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-[#D9E2EC] px-4 py-2.5 text-sm text-[#043658] placeholder:text-[#6B7C93] focus:outline-none focus:ring-2 focus:ring-[#043658]/20 focus:border-[#043658]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 rounded-lg bg-[#043658] py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer Note */}
            <div className="mt-8 p-4 rounded-lg bg-[#F8FAFC] border border-[#E8EEF3]">
              <p className="text-xs text-[#6B7C93] text-center">
                <strong>Default Admin Credentials:</strong>
                <br />
                Email: admin@servelink.et
                <br />
                Password: Admin@ServeLink2025
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
