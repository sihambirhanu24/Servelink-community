import { BadgeCheck, Pencil, Shield, Share2 } from 'lucide-react';
import Link from "next/link";

interface ProfileHeaderCardProps {
  name: string;
  verified: boolean;
  schoolName: string;
  department: string;
  avatarUrl?: string;
}

export function ProfileHeaderCard({ name, verified, schoolName, department, avatarUrl }: ProfileHeaderCardProps) {
 
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="h-16 w-16 rounded-2xl bg-[#043658] flex items-center justify-center text-white text-lg font-semibold shrink-0">
            {name.split(' ').map((n) => n[0]).join('')}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-['Lexend'] font-semibold text-[#043658] text-lg">{name}</p>
            {verified && <BadgeCheck className="h-4 w-4 text-[#FFC107] fill-[#043658]" />}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            {schoolName} · {department}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Link href="/profile/edit"></Link>
           <Link href="/profile/edit">
  <button className="flex items-center gap-1.5 rounded-lg bg-[#043658] px-4 py-2 text-xs font-medium text-white hover:bg-[#043658]/90 transition-colors">
    <Pencil className="h-3.5 w-3.5" />
    Edit Profile
  </button>
</Link>

<Link href="/profile/change-password">
  <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-[#043658] hover:bg-slate-50 transition-colors">
    <Shield className="h-3.5 w-3.5" />
    Change Password
  </button>
</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
