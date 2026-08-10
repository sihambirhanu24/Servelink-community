'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Users, Heart, Bookmark, Bell, GraduationCap, CheckCircle2, Lock } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

export function DashboardSection() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Everything Important in One Place</h2>
          <p className="mt-1.5 text-sm text-slate-600">Your dashboard gives an instant overview of your community activity.</p>
        </FI>
        <FI d={0.1} className="mt-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="bg-[#043658] px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[#FFC107]" /><span className="text-sm font-bold text-white">ServeLink Dashboard</span></div>
              <div className="flex items-center gap-2"><Bell className="h-3.5 w-3.5 text-white/60" /><div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold text-white">SB</div></div>
            </div>
            <div className="grid gap-3 p-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-[#043658]/5 to-white p-3">
                  <div className="flex items-center justify-between">
                    <div><p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Teacher Progress</p><p className="text-sm font-black text-[#043658]">Siham Birhanu</p></div>
                    <span className="rounded-full bg-[#043658] px-2.5 py-0.5 text-[10px] font-bold text-[#FFC107]">LEVEL 1</span>
                  </div>
                  <div className="mt-2">
                    <div className="mb-0.5 flex justify-between text-[10px] text-slate-500"><span>Level 1 of 5</span><span>20%</span></div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100"><div className="h-1.5 w-[20%] rounded-full bg-[#FFC107]" /></div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[{ icon:FileText, v:'28', l:'Posts' },{ icon:Users, v:'3', l:'Communities' },{ icon:Heart, v:'157', l:'Likes' },{ icon:Bookmark, v:'18', l:'Saved' }].map(({ icon:Icon, v, l }) => (
                    <div key={l} className="rounded-lg border border-slate-100 bg-slate-50 py-2 text-center">
                      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-slate-400" />
                      <p className="text-sm font-black text-[#043658]">{v}</p>
                      <p className="text-[9px] uppercase text-slate-400">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Recent Posts</p>
                  {['Interactive Mathematics Activities for Grade 8','New strategies for student engagement in class'].map((title, i) => (
                    <div key={title} className={`flex items-center justify-between py-1.5 ${i<1?'border-b border-slate-50':''}`}>
                      <p className="text-xs text-[#043658] truncate mr-2">{title}</p>
                      <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-slate-400"><Heart className="h-2.5 w-2.5" />24</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Community Access</p>
                  {[{ name:'School', u:true },{ name:'Woreda', u:false },{ name:'Zone', u:false }].map(({ name, u }) => (
                    <div key={name} className="mb-1.5 flex items-center gap-2">
                      {u ? <CheckCircle2 className="h-3.5 w-3.5 text-[#043658]" /> : <Lock className="h-3.5 w-3.5 text-slate-300" />}
                      <span className={`text-xs ${u?'font-medium text-[#043658]':'text-slate-400'}`}>{name}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-100 bg-white p-3">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">Recent Activity</p>
                  {['❤️ Yared liked your post','💬 Martha commented','🏫 You joined a community'].map((a) => (
                    <p key={a} className="border-b border-slate-50 py-1 text-[11px] last:border-0 text-slate-600">{a}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FI>
      </div>
    </section>
  );
}
