import React, { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Calendar, Clock, Loader2, Globe, Video } from "lucide-react";
import api from "@/lib/axios";

enum LiveSessionProvider {
  LIVEKIT = 'LIVEKIT',
  GOOGLE_MEET = 'GOOGLE_MEET',
}

interface CreateLiveSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateLiveSessionModal({ isOpen, onClose, onSuccess }: CreateLiveSessionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    topic: "",
    description: "",
    provider: LiveSessionProvider.LIVEKIT,
    meetingUrl: "",
    scheduledStart: "",
    duration: 60,
    isPaid: false,
    price: "",
    visibility: "NETWORK",
    maxParticipants: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        topic: formData.topic,
        description: formData.description || undefined,
        provider: formData.provider,
        meetingUrl: formData.provider === LiveSessionProvider.GOOGLE_MEET ? formData.meetingUrl : undefined,
        scheduledStart: new Date(formData.scheduledStart).toISOString(),
        duration: Number(formData.duration),
        isPaid: formData.isPaid,
        price: formData.isPaid && formData.price ? Number(formData.price) : undefined,
        visibility: formData.visibility,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
      };

      await api.post("/live-sessions", payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create live session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <Dialog.Title as="h3" className="font-['Lexend'] text-xl font-semibold text-[#043658]">
                    Create Live Session
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  {error && (
                    <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Topic / Title *</label>
                    <input
                      required
                      type="text"
                      className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      placeholder="e.g. Advanced Grade 12 Mathematics"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What will students learn in this session?"
                    />
                  </div>

                  {/* Provider Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Video className="h-4 w-4" /> Session Provider *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        formData.provider === LiveSessionProvider.LIVEKIT
                          ? 'border-[#043658] bg-blue-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="provider"
                          value={LiveSessionProvider.LIVEKIT}
                          checked={formData.provider === LiveSessionProvider.LIVEKIT}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value as LiveSessionProvider })}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">LiveKit</span>
                            {formData.provider === LiveSessionProvider.LIVEKIT && (
                              <div className="h-5 w-5 rounded-full bg-[#043658] flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">Built-in video platform</p>
                        </div>
                      </label>

                      <label className={`relative flex cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        formData.provider === LiveSessionProvider.GOOGLE_MEET
                          ? 'border-[#043658] bg-blue-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="provider"
                          value={LiveSessionProvider.GOOGLE_MEET}
                          checked={formData.provider === LiveSessionProvider.GOOGLE_MEET}
                          onChange={(e) => setFormData({ ...formData, provider: e.target.value as LiveSessionProvider })}
                          className="sr-only"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-900">Google Meet</span>
                            {formData.provider === LiveSessionProvider.GOOGLE_MEET && (
                              <div className="h-5 w-5 rounded-full bg-[#043658] flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-white"></div>
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-slate-600">Use your Google Meet link</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Google Meet URL Field */}
                  {formData.provider === LiveSessionProvider.GOOGLE_MEET && (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Google Meet URL *
                      </label>
                      <input
                        required
                        type="url"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                        value={formData.meetingUrl}
                        onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                        placeholder="https://meet.google.com/abc-defg-hij"
                      />
                      <p className="mt-2 text-xs text-slate-600">
                        💡 Create a meeting in Google Meet and paste the link here. Students will join via this external link.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> Start Time *
                      </label>
                      <input
                        required
                        type="datetime-local"
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                        value={formData.scheduledStart}
                        onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Duration (mins) *
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      >
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>60 minutes</option>
                        <option value={90}>90 minutes</option>
                        <option value={120}>120 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700 flex items-center gap-1">
                      <Globe className="h-4 w-4" /> Visibility *
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                    >
                      <option value="NETWORK">Network (All Teachers)</option>
                      <option value="NATIONAL">National Community</option>
                      <option value="REGION">My Region Only</option>
                      <option value="ZONE">My Zone Only</option>
                      <option value="WOREDA">My Woreda Only</option>
                      <option value="SCHOOL">My School Only</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      Only teachers matching this level will see your session.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-slate-900">Paid Session</h4>
                        <p className="text-xs text-slate-500">Require students to pay via Chapa</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={formData.isPaid}
                          onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                        />
                        <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#043658] peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#043658]/30"></div>
                      </label>
                    </div>

                    {formData.isPaid && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <label className="mb-1 block text-sm font-medium text-slate-700">Price (ETB) *</label>
                        <input
                          required={formData.isPaid}
                          type="number"
                          min="0"
                          step="0.01"
                          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g. 150"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#043658] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#032742] transition-colors disabled:opacity-70"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Publish Session
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
