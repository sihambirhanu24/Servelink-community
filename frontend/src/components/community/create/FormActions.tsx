"use client";

import { Loader2, Rocket, X } from "lucide-react";

interface Props {
  loading: boolean;
  onPublish: () => void;
}

export default function FormActions({
  loading,
  onPublish,
}: Props) {
  return (
    <div className="flex flex-col-reverse items-stretch justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center">

     <button type="button" className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50">
       <X className="mr-2 inline-block h-4 w-4" />
       Cancel
     </button>

     <button
  type="button"
  onClick={() => {
    console.log("BUTTON CLICKED");
    
    onPublish();
  }}
  disabled={loading}
  className="rounded-full bg-[#043658] px-7 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#032742] disabled:cursor-not-allowed disabled:opacity-60"
>
  {loading ? <><Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" /> Publishing...</> : <><Rocket className="mr-2 inline-block h-4 w-4" /> Publish Post</>}
</button>

    </div>
  );
}