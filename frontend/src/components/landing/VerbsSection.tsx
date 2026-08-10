'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:16 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.4, delay:d }} className={className}>{children}</motion.div>;
}

const VERBS = [
  { word:'CONNECT', sub:'Meet educators.', gold:false },
  { word:'SHARE', sub:'Share knowledge.', gold:true },
  { word:'DISCUSS', sub:'Learn together.', gold:false },
  { word:'SAVE', sub:'Bookmark content.', gold:false },
  { word:'GROW', sub:'Expand your network.', gold:true },
];

export function VerbsSection() {
  return (
    <section className="bg-[#043658] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-5">
          {VERBS.map(({ word, sub, gold }, i) => (
            <FI key={word} d={i*0.06}>
              <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-center hover:bg-white/10 transition-all">
                <span className={`text-2xl font-black tracking-tight lg:text-3xl ${gold?'text-[#FFC107]':'text-white'}`}>{word}</span>
                <p className="mt-1 text-[11px] text-white/55">{sub}</p>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
