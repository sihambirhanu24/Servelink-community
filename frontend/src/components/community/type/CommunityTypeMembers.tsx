interface Member {
  teacher: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    level: string;
    school: string;
    subject: string | null;
  };
}

export function CommunityTypeMembers({ members }: { members: Member[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Teachers Here</h3>
      {members.length === 0 ? (
        <p className="text-sm text-slate-400">No members yet.</p>
      ) : (
        <div className="space-y-3">
          {members.slice(0, 8).map(({ teacher: t }) => (
            <div key={t.id} className="flex items-center gap-3">
              {t.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={t.profileImage} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-9 w-9 rounded-full bg-[#043658] flex items-center justify-center text-white text-xs font-semibold shrink-0">
                  {t.firstName[0]}{t.lastName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#043658] truncate">{t.firstName} {t.lastName}</p>
                <p className="text-xs text-slate-400 truncate">{t.school} · {t.subject ?? 'No subject listed'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
