import { ShieldOff } from 'lucide-react';

export function CommunityTypeAccessDenied({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-14 w-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
        <ShieldOff className="h-6 w-6 text-red-500" />
      </div>
      <p className="font-['Lexend'] text-lg font-semibold text-[#043658]">Access Denied</p>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">
        {message ?? "Your teacher level doesn't grant access to this community."}
      </p>
    </div>
  );
}
