'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { AlertCircle, Sparkles } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const PROBLEMS = [
  'Knowledge gets trapped inside individual classrooms.',
  'Teaching resources are scattered across different platforms.',
  'Teachers often have limited professional networks.',
  'Good ideas may never reach the educators who need them.',
];

const AVATARS = ['SB','YT','MA','AB','GT','LM'];

export function WhySection() {
  return (
    <section className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <FI>
            <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Teaching Shouldn't Happen in Isolation.</h2>
            <p className="mt-2 text-sm text-slate-600">Every teacher has valuable ideas. Too often those insights never leave the classroom.</p>
            <div className="mt-3 space-y-2">
              {PROBLEMS.map((p) => (
                <div key={p} className="flex items-start gap-2.5 rounded-lg border border-red-100 bg-red-50/60 p-2.5">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                  <p className="text-sm text-slate-700">{p}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-[#FFC107]/30 bg-[#FFC107]/10 p-3">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#043658]" />
              <p className="text-sm font-semibold text-[#043658]">ServeLink brings teachers, knowledge, resources, and conversations together in one structured community.</p>
            </div>
          </FI>
          <FI d={0.15}>
            <div className="flex items-center justify-center">
              <div className="relative h-52 w-52">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#043658] shadow-xl">
                    <span className="text-[10px] font-bold text-center text-white leading-tight">SERVE<br/>LINK</span>
                  </div>
                </div>
                {AVATARS.map((init, i) => {
                  const angle = (i/AVATARS.length)*2*Math.PI - Math.PI/2;
                  const x = 50 + 42*Math.cos(angle);
                  const y = 50 + 42*Math.sin(angle);
                  return (
                    <motion.div key={init} className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#043658] text-[10px] font-bold text-white shadow-md ring-2 ring-white" style={{ left:`${x}%`, top:`${y}%` }} animate={{ scale:[1,1.08,1] }} transition={{ duration:2, delay:i*0.3, repeat:Infinity }}>
                      {init}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </FI>
        </div>
      </div>
    </section>
  );
}
