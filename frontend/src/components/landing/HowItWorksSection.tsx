'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { UserPlus, Star, Users, MessageCircle, TrendingUp, ChevronDown } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const STEPS = [
  { num:'01', icon:UserPlus, title:'Register', desc:'Create your teacher account.', color:'bg-[#FFC107]/20 text-[#043658]' },
  { num:'02', icon:Star, title:'Start at Level 1', desc:'Every registered teacher automatically starts at LEVEL 1.', color:'bg-[#FFC107]/30 text-[#043658]' },
  { num:'03', icon:Users, title:'Join Your Community', desc:'Available communities are determined by your level.', color:'bg-[#043658]/10 text-[#043658]' },
  { num:'04', icon:MessageCircle, title:'Participate', desc:'Post, like, comment, bookmark and share resources.', color:'bg-[#043658]/15 text-[#043658]' },
  { num:'05', icon:TrendingUp, title:'Grow', desc:'Higher levels unlock wider communities.', color:'bg-[#043658]/20 text-[#043658]' },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">How ServeLink Works</h2>
          <p className="mt-1.5 text-sm text-slate-600">Five simple steps from registration to a growing professional network.</p>
        </FI>
        <div className="mt-4 flex flex-col items-center">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex w-full max-w-md flex-col items-center">
              <FI d={i*0.07} className="w-full">
                <div className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-black ${step.color}`}>{step.num}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <step.icon className="h-3.5 w-3.5 text-[#043658]" />
                      <h3 className="text-sm font-bold text-[#043658]">{step.title}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{step.desc}</p>
                  </div>
                </div>
              </FI>
              {i < STEPS.length-1 && <div className="flex h-5 items-center text-[#043658]/25"><ChevronDown className="h-4 w-4" /></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
