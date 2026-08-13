"use client";

import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: "🗑️",
      confirmBg: "bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    warning: {
      icon: "⚠️",
      confirmBg: "bg-gradient-to-r from-[#FFC107] to-[#FFD54F] hover:from-[#FFB300] hover:to-[#FFC107] text-[#043658]",
      iconBg: "bg-yellow-100",
      iconColor: "text-[#FFC107]",
    },
    info: {
      icon: "ℹ️",
      confirmBg: "bg-gradient-to-r from-[#043658] to-[#065a8f] hover:from-[#032a42] hover:to-[#043658]",
      iconBg: "bg-blue-100",
      iconColor: "text-[#043658]",
    },
  };

  const config = typeConfig[type];

  const dialog = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md animate-scale-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${config.iconBg} flex items-center justify-center text-xl`}>
                {config.icon}
              </div>
              <h3 className="flex-1 text-lg font-bold text-[#043658]">{title}</h3>
              <button
                onClick={onCancel}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border-2 border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition-all ${config.confirmBg}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(dialog, document.body);
}
