'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Bell, BellOff } from 'lucide-react';

interface SettingToggle {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

const SETTINGS: SettingToggle[] = [
  { id: 'likes', label: 'Likes', description: 'When someone likes your post', defaultEnabled: true },
  { id: 'comments', label: 'Comments', description: 'When someone comments on your post', defaultEnabled: true },
  { id: 'bookmarks', label: 'Bookmarks', description: 'When someone bookmarks your post', defaultEnabled: true },
  { id: 'community_join', label: 'Community activity', description: 'When you join a community', defaultEnabled: true },
  { id: 'level_upgrade', label: 'Level upgrades', description: 'When your teacher level changes', defaultEnabled: true },
  { id: 'system', label: 'Announcements', description: 'Platform announcements from admin', defaultEnabled: true },
];

export function NotificationSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>(
    Object.fromEntries(SETTINGS.map((s) => [s.id, s.defaultEnabled])),
  );

  function toggle(id: string) {
    setPreferences((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Notification settings"
        className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
      >
        <Settings className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/20"
              aria-hidden="true"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.18 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="settings-title"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 id="settings-title" className="text-base font-semibold text-[#043658]">
                  Notification Preferences
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close settings"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="divide-y divide-gray-50 px-6 py-2">
                {SETTINGS.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          preferences[setting.id] ? 'bg-[#043658]/10' : 'bg-gray-100'
                        }`}
                      >
                        {preferences[setting.id] ? (
                          <Bell className="h-3.5 w-3.5 text-[#043658]" />
                        ) : (
                          <BellOff className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{setting.label}</p>
                        <p className="text-xs text-gray-500">{setting.description}</p>
                      </div>
                    </div>
                    <button
                      role="switch"
                      aria-checked={preferences[setting.id]}
                      aria-label={`Toggle ${setting.label} notifications`}
                      onClick={() => toggle(setting.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#043658]/30 ${
                        preferences[setting.id] ? 'bg-[#043658]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${
                          preferences[setting.id] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg bg-[#043658] px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#043658]/30"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
