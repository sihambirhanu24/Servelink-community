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
        
        {/* Horizontal layout with narrower cards */}
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex items-center justify-center gap-3 min-w-max px-2">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex items-center">
                <FI d={i*0.07} className="flex-shrink-0">
                  <div className="w-40 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                    <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${step.color} mb-2`}>
                      {step.num}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <step.icon className="h-3.5 w-3.5 text-[#043658]" />
                      <h3 className="text-xs font-bold text-[#043658]">{step.title}</h3>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{step.desc}</p>
                  </div>
                </FI>
                {i < STEPS.length-1 && (
                  <div className="flex items-center px-1.5 text-[#043658]/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Mobile: Show hint to scroll horizontally */}
        <FI d={0.4} className="mt-3 text-center lg:hidden">
          <p className="text-xs text-slate-400">← Scroll to see all steps →</p>
        </FI>
      </div>
    </section>
  );
}
