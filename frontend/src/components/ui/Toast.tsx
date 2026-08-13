"use client";

import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = "info", duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const config = {
    success: {
      bg: "bg-gradient-to-r from-green-500 to-emerald-600",
      icon: CheckCircle2,
      iconColor: "text-white",
    },
    error: {
      bg: "bg-gradient-to-r from-red-500 to-rose-600",
      icon: AlertCircle,
      iconColor: "text-white",
    },
    warning: {
      bg: "bg-gradient-to-r from-[#FFC107] to-[#FFD54F]",
      icon: AlertTriangle,
      iconColor: "text-[#043658]",
    },
    info: {
      bg: "bg-gradient-to-r from-[#043658] to-[#065a8f]",
      icon: Info,
      iconColor: "text-white",
    },
  };

  const { bg, icon: Icon, iconColor } = config[type];

  return (
    <div
      className={`${bg} rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${iconColor}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className={`flex-1 text-sm font-medium ${type === "warning" ? "text-[#043658]" : "text-white"}`}>
          {message}
        </p>
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${type === "warning" ? "text-[#043658] hover:text-[#032a42]" : "text-white/80 hover:text-white"} transition-colors`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
