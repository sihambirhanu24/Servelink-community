'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, Share2, TrendingUp } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const CARDS = [
  { icon: Users, title: 'Connect', desc: 'Connect with teachers in your school, woreda, zone, region, and the national community.', color: 'bg-[#043658]/8 text-[#043658]' },
  { icon: Share2, title: 'Share', desc: 'Share ideas, lesson plans, experiences, images, PDFs, and DOCX resources.', color: 'bg-[#FFC107]/15 text-[#043658]' },
  { icon: TrendingUp, title: 'Grow', desc: 'Participate in communities and progress through a structured teacher-level system.', color: 'bg-emerald-50 text-emerald-700' },
];

export function WhatIsSection() {
  return (
    <section id="about" className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">What is ServeLink?</h2>
          <p className="mt-1.5 text-sm text-slate-600">A professional online community built for teachers — to connect, share, and grow.</p>
        </FI>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {CARDS.map(({ icon: Icon, title, desc, color }, i) => (
            <FI key={title} d={i*0.08} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
              <h3 className="mb-1 text-base font-bold text-[#043658]">{title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{desc}</p>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
