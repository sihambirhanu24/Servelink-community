'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, X } from 'lucide-react';

export function ProtectedActionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleShowModal = () => {
      console.log('ProtectedActionModal: show-verification-modal event received!');
      setIsOpen(true);
    };

    console.log('ProtectedActionModal: Event listener registered.');
    window.addEventListener('show-verification-modal', handleShowModal);
    return () => {
      window.removeEventListener('show-verification-modal', handleShowModal);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-semibold text-slate-800 text-lg">Teacher Verification Required</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-slate-600 text-sm leading-relaxed">
            Please verify your teacher account before performing this action. This helps us maintain a secure and trusted community environment.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              router.push('/verification-setup');
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-[#043658] rounded-lg hover:bg-[#043658]/90 transition-colors"
          >
            Verify Account
          </button>
        </div>
      </div>
    </div>
  );
}

console.log('ProtectedActionModal module loaded.');
