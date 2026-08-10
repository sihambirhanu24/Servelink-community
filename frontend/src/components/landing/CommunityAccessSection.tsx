'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle2, Lock, Users, GraduationCap, Building2, Globe, MapPin } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

export function CommunityAccessSection() {
  return (
    <section className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <FI>
            <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Dynamic Access Based on Your Level</h2>
            <p className="mt-2 text-sm text-slate-600">Community availability is determined by the teacher's level. As your level increases, new communities become available.</p>
            <div className="mt-3 space-y-1.5">
              {['Level 1 gives immediate access to School Community','Level 2 unlocks Woreda Community','Each level unlocks a broader community','All previous communities remain accessible'].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#FFC107]" />
                  <span className="text-xs text-slate-700">{t}</span>
                </div>
              ))}
            </div>
          </FI>

          <FI d={0.12}>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Level</p>
                  <p className="text-base font-black text-[#043658]">LEVEL 2 TEACHER</p>
                </div>
                <span className="rounded-full bg-[#FFC107] px-2.5 py-1 text-xs font-black text-[#043658]">LEVEL 2</span>
              </div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#043658]">Available</p>
              {[{ name:'School Community', count:'128 Teachers', icon:GraduationCap },{ name:'Woreda Community', count:'243 Teachers', icon:Building2 }].map((c) => (
                <div key={c.name} className="mb-2 flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50 p-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-[#043658]">{c.name}</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{c.count}</p>
                    </div>
                  </div>
                  <button className="rounded-lg bg-[#043658] px-2.5 py-1 text-[10px] font-semibold text-white">Join</button>
                </div>
              ))}
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Locked</p>
              {[{ name:'Zone Community', unlock:'Level 3' },{ name:'Regional Community', unlock:'Level 4' },{ name:'National Community', unlock:'Level 5' }].map((c) => (
                <div key={c.name} className="mb-1.5 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2">
                  <div className="flex items-center gap-2"><Lock className="h-3.5 w-3.5 text-slate-300" /><p className="text-xs text-slate-400">{c.name}</p></div>
                  <span className="text-[9px] font-bold text-slate-400">Unlock at {c.unlock}</span>
                </div>
              ))}
            </div>
          </FI>
        </div>
      </div>
    </section>
  );
}
