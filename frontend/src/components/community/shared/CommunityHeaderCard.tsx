interface CommunityHeaderCardProps {
  name: string;
  description: string;
  memberCount: string;
  dailyPostCount: string;
}

export function CommunityHeaderCard({
  name,
  description,
  memberCount,
  dailyPostCount,
}: CommunityHeaderCardProps) {
  return (
    <div className="rounded-2xl bg-[#043658] p-6 text-white">
      <h1 className="font-['Lexend'] text-xl font-semibold">{name}</h1>
      <p className="mt-1.5 text-sm text-slate-300 max-w-lg leading-relaxed">{description}</p>

      <div className="mt-5 flex items-center gap-8">
        <div>
          <p className="font-['Lexend'] text-lg font-semibold text-[#FFC107]">{memberCount}</p>
          <p className="text-xs text-slate-400">Members</p>
        </div>
        <div>
          <p className="font-['Lexend'] text-lg font-semibold text-[#FFC107]">{dailyPostCount}</p>
          <p className="text-xs text-slate-400">Daily Posts</p>
        </div>
      </div>
    </div>
  );
}
