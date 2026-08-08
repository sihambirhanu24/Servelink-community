interface CommunityTypeHeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export function CommunityTypeHero({ eyebrow, title, subtitle }: CommunityTypeHeroProps) {
  return (
    <div className="rounded-2xl bg-[#043658] p-8">
      <span className="inline-block rounded-full bg-[#FFC107] px-3 py-1 text-[10px] font-semibold text-[#043658] uppercase tracking-wide">
        {eyebrow}
      </span>
      <h1 className="mt-4 font-['Lexend'] text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">{subtitle}</p>
    </div>
  );
}

interface CommunityTypeStatsProps {
  postCount: number;
  memberCount: number;
  memberLabel: string;
}

// Only 2 stats — the only 2 your backend's _count actually computes.
export function CommunityTypeStats({ postCount, memberCount, memberLabel }: CommunityTypeStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="font-['Lexend'] text-xl font-semibold text-[#043658]">{postCount}</p>
        <p className="text-xs text-slate-400 mt-0.5">Posts</p>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="font-['Lexend'] text-xl font-semibold text-[#043658]">{memberCount}</p>
        <p className="text-xs text-slate-400 mt-0.5">{memberLabel}</p>
      </div>
    </div>
  );
}
