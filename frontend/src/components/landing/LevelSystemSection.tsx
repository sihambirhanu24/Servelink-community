'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GraduationCap, Building2, MapPin, Globe, Lock, CheckCircle2 } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const LEVELS = [
  { label:'Level 1', community:'School Community', desc:'Your starting point.', badge:'At Registration', unlocked:true, gold:true, icon:GraduationCap },
  { label:'Level 2', community:'Woreda Community', desc:'Expand beyond your school.', badge:'Unlock at Level 2', unlocked:true, gold:false, icon:Building2 },
  { label:'Level 3', community:'Zone Community', desc:'Wider professional network.', badge:'Unlock at Level 3', unlocked:false, gold:false, icon:MapPin },
  { label:'Level 4', community:'Regional Community', desc:'Across your entire region.', badge:'Unlock at Level 4', unlocked:false, gold:false, icon:Globe },
  { label:'Level 5', community:'National Community', desc:'Country-wide network.', badge:'Unlock at Level 5', unlocked:false, gold:false, icon:Globe },
];

export function LevelSystemSection() {
  return (
    <section id="levels" className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Your Network Grows With You</h2>
          <p className="mt-1.5 text-sm text-slate-600">Five teacher levels. Every new teacher starts at Level 1 — automatically.</p>
        </FI>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {LEVELS.map((level, i) => (
            <FI key={level.label} d={i*0.07}>
              <div className={`relative flex h-full flex-col rounded-xl border-2 p-3 transition-all hover:-translate-y-0.5 hover:shadow-md ${level.gold ? 'border-[#FFC107] bg-[#FFC107]/8 shadow-sm' : level.unlocked ? 'border-[#043658]/20 bg-white' : 'border-slate-200 bg-white opacity-70'}`}>
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${level.gold ? 'bg-[#FFC107] text-[#043658]' : level.unlocked ? 'bg-[#043658] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  <level.icon className="h-4 w-4" />
                </div>
                <div className="mb-0.5 flex items-center gap-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${level.unlocked ? 'text-[#043658]' : 'text-slate-400'}`}>{level.label}</span>
                  {level.gold ? <CheckCircle2 className="h-3 w-3 text-[#FFC107]" /> : !level.unlocked ? <Lock className="h-2.5 w-2.5 text-slate-300" /> : null}
                </div>
                <h3 className={`mb-1 text-xs font-bold ${level.unlocked ? 'text-[#043658]' : 'text-slate-400'}`}>{level.community}</h3>
                <p className="flex-1 text-[11px] text-slate-500">{level.desc}</p>
                <div className={`mt-2 rounded-full px-2 py-0.5 text-center text-[9px] font-bold uppercase ${level.gold ? 'bg-[#FFC107]/20 text-[#043658]' : level.unlocked ? 'bg-[#043658]/8 text-[#043658]' : 'bg-slate-100 text-slate-400'}`}>
                  {level.badge}
                </div>
              </div>
            </FI>
          ))}
        </div>
        <FI d={0.25} className="mt-3 rounded-xl border border-[#FFC107]/30 bg-[#FFC107]/8 px-4 py-3 text-center">
          <p className="text-xs font-bold text-[#043658]">Register → Automatically receive Level 1 → School Community available immediately. No Level 0.</p>
        </FI>
      </div>
    </section>
  );
}
