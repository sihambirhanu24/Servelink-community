'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:16 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.4, delay:d }} className={className}>{children}</motion.div>;
}

const STATS = [
  { value:'5,000+', label:'Active Teachers' },
  { value:'350+', label:'Schools Connected' },
  { value:'25,000+', label:'Posts Shared' },
  { value:'8,500+', label:'Resources Uploaded' },
  { value:'5', label:'Community Levels' },
];

export function StatsSection() {
  return (
    <section className="bg-[#043658] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {STATS.map(({ value, label }, i) => (
            <FI key={label} d={i*0.06}>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center hover:bg-white/10 transition-all">
                <p className="text-2xl font-black text-[#FFC107]">{value}</p>
                <p className="mt-0.5 text-xs text-white/65">{label}</p>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
