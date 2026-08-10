'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Heart, MessageCircle, Bookmark, MoreHorizontal, BadgeCheck, Send } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

function PostCard({ author, initials, level, community, title, likes, comments, saves, showComments=false }: { author:string; initials:string; level:string; community:string; title:string; likes:number; comments:number; saves:number; showComments?:boolean }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#043658] text-xs font-bold text-white">{initials}</div>
          <div>
            <div className="flex items-center gap-1"><p className="text-sm font-bold text-[#043658]">{author}</p><BadgeCheck className="h-3.5 w-3.5 text-[#FFC107]" /></div>
            <p className="text-[10px] text-slate-400">{level} · {community}</p>
          </div>
        </div>
        <button className="p-1 text-slate-400"><MoreHorizontal className="h-4 w-4" /></button>
      </div>
      <p className="mt-2 text-sm font-semibold text-[#043658]">{title}</p>
      <div className="mt-2.5 flex items-center gap-4">
        <button onClick={() => setLiked(!liked)} className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />{liked ? likes+1 : likes}
        </button>
        <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#043658]"><MessageCircle className="h-3.5 w-3.5" />{comments}</button>
        <button onClick={() => setSaved(!saved)} className={`flex items-center gap-1 text-xs transition-colors ${saved ? 'text-[#FFC107]' : 'text-slate-400 hover:text-[#FFC107]'}`}>
          <Bookmark className={`h-3.5 w-3.5 ${saved ? 'fill-current' : ''}`} />{saved ? saves+1 : saves}
        </button>
      </div>
      {showComments && (
        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
          {[{ init:'YT', name:'Yared Tekle', msg:'We started using small group experiments and it changed how students engage…' },{ init:'SB', name:'Siham Birhanu', msg:'I tried something similar last semester — amazing results!' }].map(({ init, name, msg }) => (
            <div key={name} className="flex items-start gap-1.5">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${init==='SB'?'bg-[#043658]':'bg-slate-400'}`}>{init}</div>
              <div className="flex-1 rounded-lg bg-slate-50 px-2.5 py-1.5">
                <p className="text-[10px] font-semibold text-[#043658]">{name}</p>
                <p className="text-[11px] text-slate-600">{msg}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-300 text-[8px] font-bold text-white">AB</div>
            <input placeholder="Write a comment…" className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs focus:border-[#043658]/40 focus:outline-none" />
            <button className="flex h-6 w-6 items-center justify-center rounded-full bg-[#043658] text-white"><Send className="h-3 w-3" /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function CommunityFeedSection() {
  return (
    <section className="bg-[#F7FAFC] py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Where Teachers Actually Connect</h2>
          <p className="mt-1.5 text-sm text-slate-600">A real, active feed of ideas, questions, and resources.</p>
        </FI>
        <div className="mt-4 mx-auto max-w-xl space-y-3">
          <FI d={0.08}><PostCard author="Martha Alem" initials="MA" level="Level 2" community="Woreda Community" title="How do you make Grade 10 biology practical sessions more interactive?" likes={42} comments={15} saves={8} showComments /></FI>
          <FI d={0.16}><PostCard author="Siham Birhanu" initials="SB" level="Level 1" community="School Community" title="Sharing my Grade 8 Mathematics lesson plan — interactive activities that worked this week." likes={28} comments={9} saves={14} /></FI>
        </div>
      </div>
    </section>
  );
}
