import { CheckCircle2, X } from 'lucide-react';

interface NotificationBannerProps {
    message: string;
    onClose: () => void;
}

export function NotificationBanner({ message, onClose }: NotificationBannerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-emerald-100 bg-white px-4 py-3 shadow-lg shadow-slate-900/5 transition-all">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
            </div>
            <p className="text-xs font-medium text-slate-800">{message}</p>
            <button
                onClick={onClose}
                aria-label="Close notification"
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
                <X className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}