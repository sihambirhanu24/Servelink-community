'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  Camera,
  CheckCircle2,
  Mail,
  Calendar,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Avatar } from '@/components/common/Avatar';
import AdminLayout from '@/components/admin/layout';
import { API_URL } from '@/lib/config';

interface AdminProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  // Form states
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success/Error states
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch admin profile
  const { data: profile, isLoading, error, refetch } = useQuery<AdminProfile>({
    queryKey: ['admin-profile'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        // Redirect to main login page (unified for all users)
        router.push('/auth/login');
        throw new Error('No authentication token found');
      }
      const res = await fetch(`${API_URL}/admin/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        // If unauthorized, redirect to login
        if (res.status === 401) {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin');
          router.push('/auth/login');
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch profile' }));
        throw new Error(errorData.message || 'Failed to fetch profile');
      }
      const data = await res.json();
      setName(data.name);
      setEmail(data.email);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Reduce retries to avoid multiple redirects
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string }) => {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/admin/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-profile'] });
      setEditMode(false);
      toast.success('Profile updated successfully!');
      setProfileError('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
      setProfileError(error.message);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully!');
      setPasswordError('');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
      setPasswordError(error.message);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');

    const updates: { name?: string; email?: string } = {};
    if (name !== profile?.name) updates.name = name;
    if (email !== profile?.email) updates.email = email;

    if (Object.keys(updates).length === 0) {
      setEditMode(false);
      return;
    }

    updateProfileMutation.mutate(updates);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      toast.error('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      toast.error('New passwords do not match');
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    if (password.length < 6) return { strength: 25, label: 'Weak', color: 'bg-red-500' };
    if (password.length < 10) return { strength: 50, label: 'Fair', color: 'bg-yellow-500' };
    if (password.length < 14) return { strength: 75, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#043658] mb-4" />
            <p className="text-sm text-slate-500">Loading profile...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-800 mb-1">Failed to load profile</p>
              <p className="text-xs text-red-600">{error?.message || 'Unknown error occurred'}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-[#043658] text-white rounded-lg text-sm font-medium hover:bg-[#032742] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        {/* Profile Hero Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Banner */}
          <div className="relative h-32 sm:h-40 bg-gradient-to-br from-[#043658] to-[#064a7a] overflow-hidden">
            {/* Subtle grid texture */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            {/* Edit button */}
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Main content */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            {/* Avatar row */}
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 -mt-12 sm:-mt-16">
              {/* Avatar + camera */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full ring-4 ring-white shadow-lg overflow-hidden">
                  <Avatar
                    name={profile.name}
                    profileImage={null}
                    size="xl"
                    className="h-full w-full"
                  />
                </div>
                {/* Camera button (disabled for now - can be enabled if upload is implemented) */}
                <button
                  disabled
                  aria-label="Change profile photo"
                  className="
                    absolute -bottom-1 -right-1
                    flex h-8 w-8 items-center justify-center
                    rounded-full bg-slate-300 text-slate-500 shadow-md
                    cursor-not-allowed opacity-50
                  "
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0 pt-14 sm:pt-16">
                {/* Name + role + status */}
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-['Lexend'] text-xl font-bold text-[#043658] sm:text-2xl truncate">
                    {profile.name}
                  </h1>
                  <span className="shrink-0 rounded-full bg-[#043658] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#FFC107]">
                    ADMINISTRATOR
                  </span>
                  <span className="flex shrink-0 items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-semibold text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                </div>

                {/* Role description */}
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-1">
                  <span className="font-medium">Platform Administrator</span>
                  <span>· System Management</span>
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    {profile.email}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit Profile Form (inline when edit mode is active) */}
            {editMode && (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-[#043658] mb-3">Edit Profile Information</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={updateProfileMutation.isPending}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-[#043658] hover:bg-[#032945] rounded-lg transition-colors disabled:opacity-50"
                      >
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode(false);
                          setName(profile.name);
                          setEmail(profile.email);
                          setProfileError('');
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Administrator Information Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#043658]/5 to-transparent px-5 py-3">
            <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
              Administrator Information
            </h3>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Role */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                  <Shield className="h-4 w-4 text-[#043658]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Role
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    Administrator
                  </p>
                </div>
              </div>

              {/* Account Status */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                  <CheckCircle2 className="h-4 w-4 text-[#043658]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Account Status
                  </p>
                  <p className="text-sm font-medium text-green-700">
                    Active
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                  <Calendar className="h-4 w-4 text-[#043658]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Member Since
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {format(new Date(profile.createdAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                  <Clock className="h-4 w-4 text-[#043658]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    Last Updated
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {format(new Date(profile.updatedAt), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#043658]/8">
                <Mail className="h-4 w-4 text-[#043658]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm font-medium text-slate-700 break-all">
                  {profile.email}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Card */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#043658]/5 to-transparent px-5 py-3">
            <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm">
              Security
            </h3>
          </div>

          <div className="p-5">
            <h4 className="text-sm font-semibold text-slate-700 mb-4">Change Password</h4>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Password Strength</span>
                        <span className={`text-xs font-medium ${passwordStrength.color.replace('bg-', 'text-')}`}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{ width: `${passwordStrength.strength}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#043658] focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-[#043658] hover:bg-[#032945] rounded-lg transition-colors disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? 'Changing Password...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
