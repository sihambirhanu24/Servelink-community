import { Plus } from 'lucide-react';

const SKILLS = ['Mathematics', 'STEM Education', 'Physics', 'Leadership', 'Curriculum Design'];

export function TopSkillsCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-['Lexend'] font-semibold text-[#043658] text-sm mb-3">Top Skills</h3>
      <div className="flex flex-wrap gap-2">
        {SKILLS.map((skill) => (
          <span
            key={skill}
            className="rounded-full bg-[#043658]/8 text-[#043658] text-xs font-medium px-3 py-1"
          >
            {skill}
          </span>
        ))}
        <button className="rounded-full border border-dashed border-slate-300 text-slate-400 h-7 w-7 flex items-center justify-center hover:border-[#043658] hover:text-[#043658] transition-colors">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
