'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const STEPS = ['Register','Level 1','Join','Share','Connect','Grow'];

export function FinalCtaSection() {
  return (
    <section className="bg-[#043658] py-10">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <FI>
          <h2 className="text-3xl font-black text-white lg:text-4xl">Your Professional Teacher<br /><span className="text-[#FFC107]">Community Starts Here.</span></h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/65">Create your account, start at Level 1, join your community, share what you know, and grow your professional network.</p>
        </FI>
        <FI d={0.1} className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link href="/auth/register" className="inline-flex items-center gap-2 rounded-xl bg-[#FFC107] px-7 py-3 text-sm font-black text-[#043658] shadow-lg hover:bg-[#FFB300] hover:-translate-y-0.5 transition-all">
            Create Your Teacher Account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/auth/login" className="rounded-xl border-2 border-white/30 px-7 py-3 text-sm font-bold text-white hover:border-white/60 hover:bg-white/5 transition-all">
            Already have an account? Sign In
          </Link>
        </FI>
        <FI d={0.18} className="mt-4">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${i===0||i===STEPS.length-1?'bg-[#FFC107] text-[#043658]':'bg-white/10 text-white'}`}>{step}</span>
                {i<STEPS.length-1 && <ArrowRight className="h-3 w-3 text-white/30" />}
              </div>
            ))}
          </div>
        </FI>
        <FI d={0.22} className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          {['Free to join','Start at Level 1 immediately','No approval required'].map((t) => (
            <div key={t} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#FFC107]" />
              <span className="text-xs text-white/65">{t}</span>
            </div>
          ))}
        </FI>
      </div>
    </section>
  );
}
