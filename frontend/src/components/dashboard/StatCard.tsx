import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  iconColor: string;
  value: string;
  label: string;
}

export function StatCard({ icon: Icon, iconColor, value, label }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <p className="mt-3 font-['Lexend'] text-2xl font-semibold text-[#043658]">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
