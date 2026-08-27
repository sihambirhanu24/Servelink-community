"use client";

import React, { useState, useEffect } from "react";
import { Bell, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getNotificationPreferences, updateNotificationPreferences, NotificationPreferencePayload } from "@/services/profile";

export default function NotificationPreferencesCard() {
  const [preferences, setPreferences] = useState<NotificationPreferencePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    fetchPreferences();
    if ("Notification" in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const fetchPreferences = async () => {
    try {
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch (error) {
      toast.error("Failed to load notification preferences.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (key: keyof NotificationPreferencePayload, value: any) => {
    if (!preferences) return;
    
    // Optimistic update
    setPreferences({ ...preferences, [key]: value });
    setIsSaving(true);
    
    try {
      await updateNotificationPreferences({ [key]: value });
    } catch (error) {
      toast.error("Failed to update preference.");
      // Revert on error
      setPreferences(preferences);
    } finally {
      setIsSaving(false);
    }
  };

  const playTestSound = () => {
    // In a real app, you would load the audio file based on preferences.soundType
    // For now, we will use a browser beep or just log it if no audio files exist
    try {
      const audio = new Audio("/sounds/notification.mp3"); // Replace with actual path if it exists
      audio.play().catch((e) => {
        console.warn("Audio playback failed (maybe missing file):", e);
        toast("Sound played (Audio file not found in public/sounds)", { icon: "🔔" });
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleBrowserNotification = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support desktop notifications");
      return;
    }

    if (Notification.permission === "granted") {
      toast.success("Browser notifications are already enabled");
      return;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === "granted") {
        toast.success("Browser notifications enabled");
        handleUpdate("browserNotifications", true);
      }
    } else {
      toast.error("Notifications are blocked in your browser settings. Please enable them manually.");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#043658]" />
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center">
            <Bell className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            <p className="text-sm text-gray-500">Control how ServeLink reaches you</p>
          </div>
        </div>
        {isSaving && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
      </div>

      <div className="p-6 space-y-8">
        {/* Sound & Browser Settings */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Notification sound</h3>
              <p className="text-sm text-gray-500">Play a sound for new notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.soundEnabled}
                onChange={(e) => handleUpdate("soundEnabled", e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wider text-xs mb-1">Sound Type</h3>
              <select 
                value={preferences.soundType}
                onChange={(e) => handleUpdate("soundType", e.target.value)}
                disabled={!preferences.soundEnabled}
                className="block w-48 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#043658] focus:border-[#043658] sm:text-sm disabled:opacity-50"
              >
                <option value="ServeLink">ServeLink</option>
                <option value="Soft">Soft</option>
                <option value="Classic">Classic</option>
                <option value="Minimal">Minimal</option>
                <option value="Silent">Silent</option>
              </select>
            </div>
            <button
              onClick={playTestSound}
              disabled={!preferences.soundEnabled}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              Test sound
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Browser notifications</h3>
            <p className="text-sm text-gray-500 mb-4">Allow ServeLink to send notifications through your browser.</p>
            <button
              onClick={handleBrowserNotification}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                browserPermission === "granted"
                  ? "bg-green-100 text-green-800 cursor-default"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              {browserPermission === "granted" ? "Browser notifications enabled" : "Manage browser alerts"}
            </button>
          </div>
        </div>

        {/* Granular Preferences */}
        <div className="pt-6 border-t border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            
            <ToggleRow 
              title="New direct messages" 
              description="Notify me when another teacher sends me a message." 
              checked={preferences.messages!} 
              onChange={(v) => handleUpdate("messages", v)} 
            />
            
            <ToggleRow 
              title="Community activity" 
              description="Notify me about activity in my communities." 
              checked={preferences.communityActivity!} 
              onChange={(v) => handleUpdate("communityActivity", v)} 
            />
            
            <ToggleRow 
              title="Questions and answers" 
              description="Notify me when someone answers my question or I get an upvote." 
              checked={preferences.questions!} 
              onChange={(v) => handleUpdate("questions", v)} 
            />
            
            <ToggleRow 
              title="Discussion activity" 
              description="Notify me about replies in discussions I follow." 
              checked={preferences.discussions!} 
              onChange={(v) => handleUpdate("discussions", v)} 
            />
            
            <ToggleRow 
              title="New resources" 
              description="Notify me when a new resource is shared in my network." 
              checked={preferences.resources!} 
              onChange={(v) => handleUpdate("resources", v)} 
            />
            
            <ToggleRow 
              title="Points and level updates" 
              description="Notify me when I earn points or level up." 
              checked={preferences.levelProgress!} 
              onChange={(v) => handleUpdate("levelProgress", v)} 
            />
            
            <ToggleRow 
              title="Important announcements" 
              description="Notify me about ServeLink updates and system announcements." 
              checked={preferences.announcements!} 
              onChange={(v) => handleUpdate("announcements", v)} 
            />

          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ title, description, checked, onChange }: { title: string, description: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <div className="flex items-start justify-between">
      <div className="pr-4">
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
        <input 
          type="checkbox" 
          className="sr-only peer" 
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#043658] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#043658]"></div>
      </label>
    </div>
  );
}
