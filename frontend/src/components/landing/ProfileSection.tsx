'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Users, Heart, Bookmark, BadgeCheck } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

function Mc({ className='' }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}

export function ProfileSection() {
  return (
    <section className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <FI d={0.1}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="h-10 bg-[#043658]" />
              <div className="px-4 pb-4">
                <div className="-mt-5 flex items-end gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#043658] text-sm font-black text-white ring-3 ring-white shadow-md">SB</div>
                  <div className="pb-0.5">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-[#043658]">Siham Birhanu</p>
                      <BadgeCheck className="h-3.5 w-3.5 text-[#FFC107]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#043658]/60">Level 1 Teacher</span>
                  </div>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-slate-600">Mathematics Teacher</p>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  <p>School: Adama Science and Technology University</p>
                  <p>Woreda: East Shewa · Region: Oromia</p>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-1.5">
                  {[{ icon:FileText, v:'28', l:'Posts' },{ icon:Users, v:'3', l:'Communities' },{ icon:Heart, v:'157', l:'Likes' },{ icon:Bookmark, v:'18', l:'Saved' }].map(({ icon:Icon, v, l }) => (
                    <div key={l} className="rounded-lg bg-slate-50 py-1.5 text-center">
                      <Icon className="mx-auto mb-0.5 h-3 w-3 text-slate-400" />
                      <p className="text-xs font-black text-[#043658]">{v}</p>
                      <p className="text-[8px] text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-1 border-b border-slate-100">
                  {['My Posts','Communities','Bookmarks','Activity'].map((t, i) => (
                    <button key={t} className={`relative px-2.5 py-1.5 text-[10px] font-semibold ${i===0?'text-[#043658]':'text-slate-400'}`}>
                      {t}{i===0 && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#043658]" />}
                    </button>
                  ))}
                </div>
                <div className="mt-2 space-y-1.5">
                  {['Interactive Mathematics Activities for Grade 8','New strategies for student engagement'].map((title) => (
                    <div key={title} className="rounded-lg border border-slate-100 bg-slate-50 p-2">
                      <p className="text-xs font-semibold text-[#043658]">{title}</p>
                      <div className="mt-1 flex gap-2.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />24</span>
                        <span className="flex items-center gap-0.5"><Mc className="h-2.5 w-2.5" />8</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FI>
          <FI>
            <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Your Professional Teacher Profile</h2>
            <p className="mt-2 text-sm text-slate-600">Every teacher on ServeLink has a professional profile representing their identity, level, and contributions.</p>
            <div className="mt-3 space-y-2">
              {['Display your level and community access','Show your posts, communities, and bookmarks','Track contributions and likes received','Build a professional presence in your community'].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <div className="h-4 w-4 shrink-0 rounded-full bg-[#FFC107]/20 flex items-center justify-center"><div className="h-1.5 w-1.5 rounded-full bg-[#FFC107]" /></div>
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </FI>
        </div>
      </div>
    </section>
  );
}
