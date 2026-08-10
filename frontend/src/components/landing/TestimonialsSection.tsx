'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quote } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const T = [
  { quote:"ServeLink gives teachers a place to share ideas that would otherwise stay inside their classrooms. The community feels genuinely professional.", name:'Abebe Bekele', role:'Mathematics Teacher', initials:'AB', level:'Level 2' },
  { quote:"The community levels help me understand how my professional network can grow. Knowing there are more levels ahead motivates me to stay active.", name:'Martha Alem', role:'Science Teacher', initials:'MA', level:'Level 3' },
  { quote:"I love being able to share lesson plans and get feedback from experienced teachers. It has improved how I teach.", name:'Yared Tekle', role:'English Teacher', initials:'YT', level:'Level 1' },
];

export function TestimonialsSection() {
  return (
    <section className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">What Teachers Are Saying</h2>
        </FI>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {T.map(({ quote, name, role, initials, level }, i) => (
            <FI key={name} d={i*0.1}>
              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                <Quote className="mb-2 h-5 w-5 text-[#FFC107]" />
                <p className="flex-1 text-xs leading-relaxed text-slate-700">"{quote}"</p>
                <div className="mt-3 flex items-center gap-2.5 border-t border-slate-100 pt-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">{initials}</div>
                  <div>
                    <p className="text-xs font-bold text-[#043658]">{name}</p>
                    <p className="text-[10px] text-slate-500">{role}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-[#FFC107]/15 px-2 py-0.5 text-[9px] font-bold text-[#043658]">{level}</span>
                </div>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
