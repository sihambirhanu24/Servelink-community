'use client';

import { useState } from 'react';
import { Settings, Bell, Lock, Globe, Users, Database, Mail, Shield, Save, X, Check } from 'lucide-react';
import AdminLayout from '@/components/admin/layout';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Setting {
  id: string;
  label: string;
  description?: string;
  type: 'toggle' | 'input' | 'select' | 'textarea';
  value: string | boolean;
  options?: Array<{ label: string; value: string }>;
}

const settingSections: SettingSection[] = [
  { id: 'general', title: 'General Settings', description: 'Platform name, logo, and basic configuration', icon: <Globe className="h-5 w-5" /> },
  { id: 'notifications', title: 'Notification Settings', description: 'Email and notification preferences', icon: <Bell className="h-5 w-5" /> },
  { id: 'security', title: 'Security Settings', description: 'Authentication and access control', icon: <Shield className="h-5 w-5" /> },
  { id: 'moderation', title: 'Moderation Settings', description: 'Content moderation policies and filters', icon: <Users className="h-5 w-5" /> },
  { id: 'email', title: 'Email Configuration', description: 'SMTP and email delivery settings', icon: <Mail className="h-5 w-5" /> },
  { id: 'backup', title: 'Backup & Database', description: 'Data backup and database management', icon: <Database className="h-5 w-5" /> },
];

const settingsData: Record<string, Setting[]> = {
  general: [
    { id: 'platform-name', label: 'Platform Name', type: 'input', value: 'ServeLink' },
    { id: 'platform-url', label: 'Platform URL', type: 'input', value: 'https://servelink.edu' },
    { id: 'support-email', label: 'Support Email', type: 'input', value: 'support@servelink.edu' },
    { id: 'timezone', label: 'Default Timezone', type: 'select', value: 'UTC', options: [
      { label: 'UTC', value: 'UTC' },
      { label: 'EST', value: 'EST' },
      { label: 'CST', value: 'CST' },
      { label: 'PST', value: 'PST' },
    ]},
  ],
  notifications: [
    { id: 'email-notifications', label: 'Email Notifications', description: 'Send email alerts to admins', type: 'toggle', value: true },
    { id: 'digest-emails', label: 'Digest Emails', description: 'Enable weekly digest emails', type: 'toggle', value: true },
    { id: 'report-alerts', label: 'Report Alerts', description: 'Notify on new content reports', type: 'toggle', value: true },
    { id: 'digest-day', label: 'Digest Email Day', type: 'select', value: 'monday', options: [
      { label: 'Monday', value: 'monday' },
      { label: 'Wednesday', value: 'wednesday' },
      { label: 'Friday', value: 'friday' },
    ]},
  ],
  security: [
    { id: 'require-2fa', label: 'Require Two-Factor Auth', description: 'Enforce 2FA for all admins', type: 'toggle', value: true },
    { id: 'session-timeout', label: 'Session Timeout (minutes)', type: 'input', value: '30' },
    { id: 'password-expiry', label: 'Password Expiry (days)', type: 'input', value: '90' },
    { id: 'ip-whitelist', label: 'IP Whitelist', description: 'Enable IP restriction for admin access', type: 'toggle', value: false },
  ],
  moderation: [
    { id: 'auto-flag-spam', label: 'Auto-flag Spam', description: 'Automatically flag suspected spam posts', type: 'toggle', value: true },
    { id: 'spam-threshold', label: 'Spam Detection Threshold', type: 'select', value: 'medium', options: [
      { label: 'Low', value: 'low' },
      { label: 'Medium', value: 'medium' },
      { label: 'High', value: 'high' },
    ]},
    { id: 'profanity-filter', label: 'Profanity Filter', description: 'Enable content filter', type: 'toggle', value: true },
    { id: 'require-approval', label: 'Require Post Approval', description: 'New user posts need approval', type: 'toggle', value: false },
  ],
  email: [
    { id: 'smtp-host', label: 'SMTP Host', type: 'input', value: 'smtp.gmail.com' },
    { id: 'smtp-port', label: 'SMTP Port', type: 'input', value: '587' },
    { id: 'smtp-user', label: 'SMTP Username', type: 'input', value: 'admin@servelink.edu' },
    { id: 'from-name', label: 'From Name', type: 'input', value: 'ServeLink Admin' },
  ],
  backup: [
    { id: 'auto-backup', label: 'Automatic Backups', description: 'Enable automatic daily backups', type: 'toggle', value: true },
    { id: 'backup-frequency', label: 'Backup Frequency', type: 'select', value: 'daily', options: [
      { label: 'Daily', value: 'daily' },
      { label: 'Weekly', value: 'weekly' },
      { label: 'Monthly', value: 'monthly' },
    ]},
    { id: 'backup-retention', label: 'Backup Retention (days)', type: 'input', value: '30' },
  ],
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(settingsData);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const currentSettings = settings[activeTab] || [];

  const handleSettingChange = (settingId: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((s) => (s.id === settingId ? { ...s, value } : s)),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setShowSaved(true);
    setHasChanges(false);
    setTimeout(() => setShowSaved(false), 3000);
  };

  const renderSetting = (setting: Setting) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <div key={setting.id} className="flex items-center justify-between p-4 rounded-lg border border-[#E8EEF3] hover:bg-[#F8FAFC] transition-colors">
            <div>
              <p className="text-sm font-semibold text-[#043658]">{setting.label}</p>
              {setting.description && <p className="text-xs text-[#6B7C93] mt-1">{setting.description}</p>}
            </div>
            <button
              onClick={() => handleSettingChange(setting.id, !setting.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                setting.value ? 'bg-[#043658]' : 'bg-[#D9E2EC]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  setting.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        );

      case 'input':
        return (
          <div key={setting.id} className="p-4 rounded-lg border border-[#E8EEF3]">
            <label className="text-sm font-semibold text-[#043658] block mb-2">{setting.label}</label>
            <input
              type="text"
              value={setting.value as string}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none focus:border-[#043658]/40"
            />
          </div>
        );

      case 'select':
        return (
          <div key={setting.id} className="p-4 rounded-lg border border-[#E8EEF3]">
            <label className="text-sm font-semibold text-[#043658] block mb-2">{setting.label}</label>
            <select
              value={setting.value as string}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] outline-none focus:border-[#043658]/40"
            >
              {setting.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case 'textarea':
        return (
          <div key={setting.id} className="p-4 rounded-lg border border-[#E8EEF3]">
            <label className="text-sm font-semibold text-[#043658] block mb-2">{setting.label}</label>
            <textarea
              value={setting.value as string}
              onChange={(e) => handleSettingChange(setting.id, e.target.value)}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg border border-[#D9E2EC] bg-white text-sm text-[#043658] placeholder:text-[#6B7C93] outline-none focus:border-[#043658]/40 resize-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-[#043658]">Settings</h1>
          <p className="mt-1 text-sm text-[#6B7C93]">Configure platform settings and preferences.</p>
        </div>

        {/* Success Notification */}
        {showSaved && (
          <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
            <Check className="h-5 w-5 text-green-700 shrink-0" />
            <p className="text-sm font-semibold text-green-700">Settings saved successfully</p>
          </div>
        )}

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
                {currentSettings.map((setting) => renderSetting(setting))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-[#E8EEF3]">
                <button
                  disabled={!hasChanges}
                  className="flex items-center gap-2 rounded-lg border border-[#D9E2EC] px-4 py-2.5 text-sm font-semibold text-[#043658] hover:bg-[#F8FAFC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className="flex items-center gap-2 rounded-lg bg-[#043658] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#05456F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
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
              <p className="text-lg font-bold text-[#043658]">Aug 12, 2026</p>
            </div>
            <div className="p-4 rounded-lg bg-[#F8FAFC] border border-[#E8EEF3]">
              <p className="text-xs text-[#6B7C93] font-semibold mb-1">Database Size</p>
              <p className="text-lg font-bold text-[#043658]">2.4 GB</p>
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
