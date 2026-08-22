"use client";

import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reason: string; description?: string }) => void;
  isLoading: boolean;
}

export function ReportPostModal({ isOpen, onClose, onSubmit, isLoading }: ReportPostModalProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;
    onSubmit({ reason, description: description.trim() || undefined });
  };

  const reportReasons = [
    { value: "SPAM", label: "Spam or misleading" },
    { value: "ABUSE", label: "Abuse or harmful content" },
    { value: "HARASSMENT", label: "Harassment or bullying" },
    { value: "MISINFORMATION", label: "Misinformation" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-[#043658]">Report Post</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Why are you reporting this post?
            </label>
            <div className="space-y-2">
              {reportReasons.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50">
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-4 w-4 text-[#043658] focus:ring-[#043658]"
                    required
                  />
                  <span className="text-sm font-medium text-gray-800">{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border p-3 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]"
              rows={3}
              placeholder="Provide more context to help us review this report..."
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason || isLoading}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
