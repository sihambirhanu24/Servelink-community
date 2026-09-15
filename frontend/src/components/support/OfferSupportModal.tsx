"use client";

import { useState, useEffect } from "react";
import { X, Plus, Minus, Loader2, CheckCircle2 } from "lucide-react";
import {
  useCreateProviderProfile,
  useUpdateProviderProfile,
  useMyProviderProfile,
} from "@/hooks/useSupport";
import type {
  SupportType,
  CreateProviderProfileDto,
  UpdateProviderProfileDto,
} from "@/services/support";

interface OfferSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SUPPORT_TYPE_OPTIONS: { value: SupportType; label: string }[] = [
  { value: "CHAT", label: "Chat Support" },
  { value: "LIVE_SESSION", label: "Live Session" },
  { value: "RESOURCE", label: "Resource Sharing" },
  { value: "MENTORSHIP", label: "Mentorship" },
];

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function OfferSupportModal({ isOpen, onClose }: OfferSupportModalProps) {
  const { data: existingProfile, isLoading: profileLoading } =
    useMyProviderProfile();
  const createProfile = useCreateProviderProfile();
  const updateProfile = useUpdateProviderProfile();

  const [expertiseInput, setExpertiseInput] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [supportTypes, setSupportTypes] = useState<SupportType[]>(["CHAT"]);
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [availabilityTime, setAvailabilityTime] = useState("");
  const [maxActiveRequests, setMaxActiveRequests] = useState(5);
  const [isAvailable, setIsAvailable] = useState(true);

  // Populate form with existing profile data
  useEffect(() => {
    if (existingProfile) {
      setExpertise(existingProfile.expertise || []);
      setExperience(existingProfile.experience || "");
      setDescription(existingProfile.description || "");
      setSupportTypes(existingProfile.supportTypes || ["CHAT"]);
      setAvailabilityDays(existingProfile.availabilityDays || []);
      setAvailabilityTime(existingProfile.availabilityTime || "");
      setMaxActiveRequests(existingProfile.maxActiveRequests || 5);
      setIsAvailable(existingProfile.isAvailable);
    }
  }, [existingProfile]);

  const handleAddExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (trimmed && !expertise.includes(trimmed) && expertise.length < 20) {
      setExpertise([...expertise, trimmed]);
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
  };

  const toggleSupportType = (type: SupportType) => {
    if (supportTypes.includes(type)) {
      if (supportTypes.length > 1) {
        setSupportTypes(supportTypes.filter((t) => t !== type));
      }
    } else {
      setSupportTypes([...supportTypes, type]);
    }
  };

  const toggleDay = (day: string) => {
    if (availabilityDays.includes(day)) {
      setAvailabilityDays(availabilityDays.filter((d) => d !== day));
    } else {
      setAvailabilityDays([...availabilityDays, day]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      expertise.length === 0 ||
      !experience.trim() ||
      !description.trim() ||
      supportTypes.length === 0 ||
      availabilityDays.length === 0
    ) {
      return;
    }

    const data = {
      expertise,
      experience: experience.trim(),
      description: description.trim(),
      supportTypes,
      availabilityDays,
      ...(availabilityTime.trim() && {
        availabilityTime: availabilityTime.trim(),
      }),
      maxActiveRequests,
      isAvailable,
    };

    if (existingProfile) {
      updateProfile.mutate(data as UpdateProviderProfileDto, {
        onSuccess: () => {
          onClose();
        },
      });
    } else {
      createProfile.mutate(data as CreateProviderProfileDto, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  if (!isOpen) return null;

  const isSubmitting = createProfile.isPending || updateProfile.isPending;
  const canSubmit =
    expertise.length > 0 &&
    experience.trim().length > 0 &&
    description.trim().length >= 10 &&
    supportTypes.length > 0 &&
    availabilityDays.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {existingProfile ? "Update Provider Profile" : "Offer Support"}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Share your expertise and help fellow teachers
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Expertise */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Areas of Expertise <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExpertise();
                  }
                }}
                placeholder="e.g., React, Mathematics, Classroom Management"
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent text-slate-900 placeholder:text-slate-400"
                disabled={isSubmitting || expertise.length >= 20}
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                disabled={!expertiseInput.trim() || expertise.length >= 20}
                className="px-4 py-2.5 bg-[#043658] text-white rounded-xl hover:bg-[#043658]/90 disabled:bg-slate-300 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {expertise.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#043658]/10 text-[#043658] rounded-lg text-sm font-medium"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(item)}
                      className="hover:text-rose-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {expertise.length}/20 expertise areas added
            </p>
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Experience <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="e.g., 5 years teaching web development"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent text-slate-900 placeholder:text-slate-400"
              maxLength={200}
              required
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500">
              {experience.length}/200 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Profile Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe how you can help other teachers..."
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent resize-none text-slate-900 placeholder:text-slate-400"
              maxLength={1000}
              required
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-slate-500">
              {description.length}/1000 characters (minimum 10)
            </p>
          </div>

          {/* Support Types */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Support Types Offered <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SUPPORT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleSupportType(option.value)}
                  className={`px-4 py-3 rounded-xl font-medium text-sm transition-all border-2 flex items-center justify-between ${
                    supportTypes.includes(option.value)
                      ? "border-[#043658] bg-[#043658]/5 text-[#043658]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  disabled={isSubmitting}
                >
                  {option.label}
                  {supportTypes.includes(option.value) && (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Days */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Available Days <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-xl font-medium text-sm transition-all border-2 ${
                    availabilityDays.includes(day)
                      ? "border-[#043658] bg-[#043658]/5 text-[#043658]"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                  disabled={isSubmitting}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Time */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Available Time Range (Optional)
            </label>
            <input
              type="text"
              value={availabilityTime}
              onChange={(e) => setAvailabilityTime(e.target.value)}
              placeholder="e.g., 18:00-21:00"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#043658] focus:border-transparent text-slate-900 placeholder:text-slate-400"
              disabled={isSubmitting}
            />
          </div>

          {/* Max Active Requests */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Maximum Active Requests
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setMaxActiveRequests(Math.max(1, maxActiveRequests - 1))
                }
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                disabled={maxActiveRequests <= 1 || isSubmitting}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-2xl font-bold text-slate-900 w-12 text-center">
                {maxActiveRequests}
              </span>
              <button
                type="button"
                onClick={() =>
                  setMaxActiveRequests(Math.min(20, maxActiveRequests + 1))
                }
                className="p-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
                disabled={maxActiveRequests >= 20 || isSubmitting}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-semibold text-slate-900">
                Currently Available
              </div>
              <div className="text-sm text-slate-600 mt-0.5">
                Allow teachers to request your support
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? "bg-[#043658]" : "bg-slate-300"
              }`}
              disabled={isSubmitting}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canSubmit}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white bg-[#043658] hover:bg-[#043658]/90 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {existingProfile ? "Updating..." : "Creating..."}
                </>
              ) : existingProfile ? (
                "Update Profile"
              ) : (
                "Create Profile"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
