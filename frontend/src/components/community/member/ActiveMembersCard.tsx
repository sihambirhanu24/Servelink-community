import { MessageCircle } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  department: string;
  online: boolean;
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Sarah Jenkins', department: 'Social Sciences', online: true },
  { id: '2', name: 'Liam O\u2019Connell', department: 'Mathematics', online: true },
  { id: '3', name: 'Dr. Martha Ray', department: 'Dean of Faculty', online: true },
];

export function ActiveMembersCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Active Members</h3>
      <div className="space-y-3">
        {MOCK_MEMBERS.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-[#043658] text-xs font-semibold">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </div>
              {member.online && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#043658] leading-tight">{member.name}</p>
              <p className="text-xs text-slate-400 leading-tight">
                {member.department} · {member.online ? 'Online' : 'Offline'}
              </p>
            </div>
            <button className="text-slate-300 hover:text-[#043658] shrink-0">
              <MessageCircle className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
