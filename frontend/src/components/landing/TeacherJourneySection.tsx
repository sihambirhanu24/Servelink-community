'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const JOURNEY = [
  { step:'Register', desc:'Create account', color:'bg-[#FFC107] text-[#043658]' },
  { step:'Level 1', desc:'Automatic', color:'bg-[#043658] text-white' },
  { step:'School', desc:'First community', color:'bg-[#043658]/80 text-white' },
  { step:'Participate', desc:'Post, like, comment', color:'bg-[#FFC107]/80 text-[#043658]' },
  { step:'Level 2', desc:'Grow', color:'bg-[#043658] text-white' },
  { step:'Woreda', desc:'Wider community', color:'bg-[#043658]/80 text-white' },
  { step:'Level 3', desc:'Zone access', color:'bg-[#043658] text-white' },
  { step:'Zone', desc:'Broader network', color:'bg-[#043658]/70 text-white' },
  { step:'Level 4', desc:'Region', color:'bg-[#043658] text-white' },
  { step:'Region', desc:'Regional', color:'bg-[#043658]/60 text-white' },
  { step:'Level 5', desc:'National', color:'bg-[#043658] text-white' },
  { step:'National', desc:'Country-wide', color:'bg-[#FFC107] text-[#043658]' },
];

export function TeacherJourneySection() {
  return (
    <section className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">From School to National Network</h2>
          <p className="mt-1.5 text-sm text-slate-600">Every ServeLink teacher starts at Level 1 and grows into a wider professional network.</p>
        </FI>
        <FI d={0.1} className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-md">
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {JOURNEY.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <motion.div className={`flex flex-col items-center rounded-xl px-3 py-2 ${item.color} shadow-sm min-w-[68px] text-center`} initial={{ opacity:0, scale:0.85 }} whileInView={{ opacity:1, scale:1 }} viewport={{ once:true }} transition={{ duration:0.35, delay:i*0.04 }} whileHover={{ scale:1.04 }}>
                    <span className="text-xs font-black leading-tight">{item.step}</span>
                    <span className="text-[8px] opacity-75">{item.desc}</span>
                  </motion.div>
                  {i<JOURNEY.length-1 && <ArrowRight className="h-3 w-3 shrink-0 text-slate-300" />}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#FFC107]" /><span className="text-[10px] text-slate-400">Action / Level up</span></div>
              <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-[#043658]" /><span className="text-[10px] text-slate-400">Community unlocked</span></div>
            </div>
          </div>
        </FI>
      </div>
    </section>
  );
}
