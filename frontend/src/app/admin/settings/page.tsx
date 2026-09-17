'use client';

import { useState, useEffect } from 'react';
import { Globe, Users, Shield, Save, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AdminLayout from '@/components/admin/layout';
import { API_URL } from '@/lib/config';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface PlatformSettings {
  // General settings
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  timezone: string;
  // Security settings
  sessionTimeout: number;
  strongPasswordRequired: boolean;
  twoFactorEnabled: boolean;
  maxLoginAttempts: number;
  // Moderation settings
  autoFlagSpam: boolean;
  spamThreshold: string;
  profanityFilter: boolean;
  requirePostApproval: boolean;
}

const settingSections: SettingSection[] = [
  { id: 'general', title: 'General Settings', description: 'Platform name, logo, and basic configuration', icon: <Globe className="h-5 w-5" /> },
  { id: 'security', title: 'Security Settings', description: 'Authentication and access control', icon: <Shield className="h-5 w-5" /> },
  { id: 'moderation', title: 'Moderation Settings', description: 'Content moderation policies and filters', icon: <Users className="h-5 w-5" /> },
];

const timezones = [
  { label: 'UTC', value: 'UTC' },
  { label: 'Africa/Addis_Ababa (EAT)', value: 'Africa/Addis_Ababa' },
  { label: 'EST (UTC-5)', value: 'EST' },
  { label: 'CST (UTC-6)', value: 'CST' },
  { label: 'PST (UTC-8)', value: 'PST' },
];

const sessionTimeoutOptions = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '4 hours', value: 240 },
];

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState('');

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError('');
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`${API_URL}/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSettings(data);
      setOriginalSettings(data);
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError('Failed to load settings. Please try again.');
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof PlatformSettings, value: any) => {
    if (!settings) return;
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(originalSettings));
  };

  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setIsSaving(true);
      const token = localStorage.getItem('admin_token');
      
      let endpoint = '';
      let payload: any = {};

      if (activeTab === 'general') {
        endpoint = `${API_URL}/admin/settings/general`;
        payload = {
          platformName: settings.platformName,
          platformUrl: settings.platformUrl,
          supportEmail: settings.supportEmail,
          timezone: settings.timezone,
        };
      } else if (activeTab === 'security') {
        endpoint = `${API_URL}/admin/settings/security`;
        payload = {
          sessionTimeout: settings.sessionTimeout,
          strongPasswordRequired: settings.strongPasswordRequired,
          maxLoginAttempts: settings.maxLoginAttempts,
        };
      } else if (activeTab === 'moderation') {
        endpoint = `${API_URL}/admin/settings/moderation`;
        payload = {
          autoFlagSpam: settings.autoFlagSpam,
          spamThreshold: settings.spamThreshold,
          profanityFilter: settings.profanityFilter,
          requirePostApproval: settings.requirePostApproval,
        };
      }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Settings save response:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to save settings' }));
        console.error('Settings save error:', errorData);
        throw new Error(errorData.message || 'Failed to save settings');
      }

      const updatedData = await res.json();
      setSettings(updatedData);
      setOriginalSettings(updatedData);
      setHasChanges(false);
      toast.success('Settings saved successfully!');
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      toast.error(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalSettings) {
      setSettings(originalSettings);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
        </div>
      </AdminLayout>
    );
  }

  if (error && !settings) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-red-600" />
          <p className="text-lg font-semibold text-[#043658]">{error}</p>
          <button
            onClick={fetchSettings}
            className="rounded-lg bg-[#043658] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!settings) return null;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#043658]">Settings</h1>
          <p className="mt-1 text-sm text-[#6B7C93]">Configure platform settings and preferences.</p>
        </div>

        {/* Settings Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-4 shadow-sm h-fit space-y-1">
              {settingSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveTab(section.id);
                    setHasChanges(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                    activeTab === section.id
                      ? 'bg-[#043658]/10 border-l-2 border-[#043658]'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className={`mt-0.5 ${activeTab === section.id ? 'text-[#043658]' : 'text-[#6B7C93]'}`}>
                    {section.icon}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${activeTab === section.id ? 'text-[#043658]' : 'text-[#043658]'}`}>
                      {section.title}
                    </p>
                    <p className="text-xs text-[#6B7C93] mt-0.5 line-clamp-2">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Settings Panel */}
            <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#043658]">
                  {settingSections.find((s) => s.id === activeTab)?.title}
                </h2>
                <p className="text-sm text-[#6B7C93] mt-1">
                  {settingSections.find((s) => s.id === activeTab)?.description}
                </p>
              </div>

              {/* Settings List */}
              <div className="space-y-4 mb-6">
                {activeTab === 'general' && (
                  <>
                    {/* Platform Name */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Platform Name</label>
                      <input
                        type="text"
                        value={settings.platformName}
                        onChange={(e) => handleChange('platformName', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none focus:border-[#043658]/40"
                      />
                    </div>

                    {/* Platform URL */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Platform URL</label>
                      <input
                        type="url"
                        value={settings.platformUrl}
                        onChange={(e) => handleChange('platformUrl', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none focus:border-[#043658]/40"
                      />
                    </div>

                    {/* Support Email */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Support Email</label>
                      <input
                        type="email"
                        value={settings.supportEmail}
                        onChange={(e) => handleChange('supportEmail', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none focus:border-[#043658]/40"
                      />
                    </div>

                    {/* Default Timezone */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Default Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => handleChange('timezone', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] outline-none focus:border-[#043658]/40"
                      >
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'security' && (
                  <>
                    {/* Session Timeout */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Session Timeout</label>
                      <select
                        value={settings.sessionTimeout}
                        onChange={(e) => handleChange('sessionTimeout', Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] outline-none focus:border-[#043658]/40"
                      >
                        {sessionTimeoutOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Strong Password Requirement */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-[#043658]">Require Strong Passwords</p>
                        <p className="text-xs text-[#6B7C93] mt-1">Enforce strong password requirements for all users</p>
                      </div>
                      <button
                        onClick={() => handleChange('strongPasswordRequired', !settings.strongPasswordRequired)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.strongPasswordRequired ? 'bg-[#043658]' : 'bg-[#D9E2EC]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.strongPasswordRequired ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Max Login Attempts */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Max Login Attempts</label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={settings.maxLoginAttempts}
                        onChange={(e) => handleChange('maxLoginAttempts', Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none focus:border-[#043658]/40"
                      />
                      <p className="text-xs text-[#6B7C93] mt-1">Number of failed login attempts before account is locked</p>
                    </div>

                    {/* Two-Factor Authentication Status */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3] bg-[#F8FAFC]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[#043658]">Two-Factor Authentication</p>
                          <p className="text-xs text-[#6B7C93] mt-1">
                            Status: {settings.twoFactorEnabled ? 'Enabled' : 'Not Configured'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${settings.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {settings.twoFactorEnabled ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      {!settings.twoFactorEnabled && (
                        <p className="text-xs text-[#6B7C93] mt-3">
                          Two-factor authentication is not currently configured for the platform. This feature requires additional setup.
                        </p>
                      )}
                    </div>
                  </>
                )}

                {activeTab === 'moderation' && (
                  <>
                    {/* Auto-flag Spam */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-[#043658]">Auto-flag Spam</p>
                        <p className="text-xs text-[#6B7C93] mt-1">Automatically flag suspected spam posts</p>
                      </div>
                      <button
                        onClick={() => handleChange('autoFlagSpam', !settings.autoFlagSpam)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.autoFlagSpam ? 'bg-[#043658]' : 'bg-[#D9E2EC]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.autoFlagSpam ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Spam Detection Threshold */}
                    <div className="p-4 rounded-lg border border-[#E8EEF3]">
                      <label className="text-sm font-semibold text-[#043658] block mb-2">Spam Detection Threshold</label>
                      <select
                        value={settings.spamThreshold}
                        onChange={(e) => handleChange('spamThreshold', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] outline-none focus:border-[#043658]/40"
                      >
                        <option value="low">Low - More sensitive</option>
                        <option value="medium">Medium - Balanced</option>
                        <option value="high">High - Less sensitive</option>
                      </select>
                    </div>

                    {/* Profanity Filter */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-[#043658]">Profanity Filter</p>
                        <p className="text-xs text-[#6B7C93] mt-1">Enable content filter for inappropriate language</p>
                      </div>
                      <button
                        onClick={() => handleChange('profanityFilter', !settings.profanityFilter)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.profanityFilter ? 'bg-[#043658]' : 'bg-[#D9E2EC]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.profanityFilter ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Require Post Approval */}
                    <div className="flex items-center justify-between p-4 rounded-lg border border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-[#043658]">Require Post Approval</p>
                        <p className="text-xs text-[#6B7C93] mt-1">New user posts need admin approval before going live</p>
                      </div>
                      <button
                        onClick={() => handleChange('requirePostApproval', !settings.requirePostApproval)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.requirePostApproval ? 'bg-[#043658]' : 'bg-[#D9E2EC]'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.requirePostApproval ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[#E8EEF3]">
                <button
                  onClick={handleCancel}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="rounded-lg border border-[#D9E2EC] bg-[#F8FAFC] p-4">
              <p className="text-xs text-[#6B7C93]">
                <span className="font-semibold text-[#043658]">Note:</span> Changes to these settings may affect platform functionality. Please review all changes before saving.
              </p>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="rounded-xl border border-[#D9E2EC] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#043658] mb-4">System Information</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E8EEF3]">
              <p className="text-xs text-[#6B7C93] font-semibold mb-1">Platform Version</p>
              <p className="text-lg font-bold text-[#043658]">2.5.1</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E8EEF3]">
              <p className="text-xs text-[#6B7C93] font-semibold mb-1">Last Updated</p>
              <p className="text-lg font-bold text-[#043658]">Aug 17, 2026</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E8EEF3]">
              <p className="text-xs text-[#6B7C93] font-semibold mb-1">Current Timezone</p>
              <p className="text-lg font-bold text-[#043658]">{settings.timezone}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E8EEF3]">
              <p className="text-xs text-[#6B7C93] font-semibold mb-1">API Status</p>
              <p className="text-lg font-bold text-green-700">Operational</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
