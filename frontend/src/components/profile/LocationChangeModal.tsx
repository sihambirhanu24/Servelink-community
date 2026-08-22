import { useState } from 'react';
import { useSubmitLocationChangeRequest } from '@/hooks/useLocationChangeRequests';
import { toast } from 'sonner';
import { Loader2, X, Upload } from 'lucide-react';

export function LocationChangeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutateAsync: submitRequest, isPending } = useSubmitLocationChangeRequest();

  const [form, setForm] = useState({
    requestedSchool: '',
    requestedWoreda: '',
    requestedZone: '',
    requestedRegion: '',
    requestedSubject: '',
  });
  
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);

  if (!isOpen) return null;

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.length < 10) {
      toast.error('Reason must be at least 10 characters long');
      return;
    }

    const formData = new FormData();
    if (form.requestedSchool) formData.append('requestedSchool', form.requestedSchool);
    if (form.requestedWoreda) formData.append('requestedWoreda', form.requestedWoreda);
    if (form.requestedZone) formData.append('requestedZone', form.requestedZone);
    if (form.requestedRegion) formData.append('requestedRegion', form.requestedRegion);
    if (form.requestedSubject) formData.append('requestedSubject', form.requestedSubject);
    
    formData.append('reason', reason);
    if (file) {
      formData.append('file', file);
    }

    try {
      await submitRequest(formData);
      toast.success('Location change request submitted successfully!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    }
  }

  const inputClass = "w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[#043658]">Request Profile Change</h2>
            <p className="text-xs text-slate-500 mt-0.5">Fill out any fields you wish to update.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">New School (Optional)</label>
              <input
                type="text"
                value={form.requestedSchool}
                onChange={(e) => handleChange('requestedSchool', e.target.value)}
                className={inputClass}
                placeholder="Enter new school name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Subject (Optional)</label>
              <input
                type="text"
                value={form.requestedSubject}
                onChange={(e) => handleChange('requestedSubject', e.target.value)}
                className={inputClass}
                placeholder="e.g. Mathematics"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Woreda (Optional)</label>
              <input
                type="text"
                value={form.requestedWoreda}
                onChange={(e) => handleChange('requestedWoreda', e.target.value)}
                className={inputClass}
                placeholder="Woreda name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Zone (Optional)</label>
              <input
                type="text"
                value={form.requestedZone}
                onChange={(e) => handleChange('requestedZone', e.target.value)}
                className={inputClass}
                placeholder="Zone name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Region (Optional)</label>
              <input
                type="text"
                value={form.requestedRegion}
                onChange={(e) => handleChange('requestedRegion', e.target.value)}
                className={inputClass}
                placeholder="Region name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Reason for Change <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`${inputClass} resize-none`}
              placeholder="Please explain why you are requesting these changes... (min 10 chars)"
              rows={2}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">Supporting Document (Optional)</label>
            <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Upload className="mb-1.5 h-5 w-5 text-slate-400" />
                <p className="text-xs text-slate-600">
                  <span className="font-semibold text-[#043658]">Click to upload</span> or drag and drop
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">PDF, DOCX, JPG or PNG (MAX. 5MB)</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                {file.name}
              </p>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#043658]/90 disabled:opacity-70 transition-all"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
