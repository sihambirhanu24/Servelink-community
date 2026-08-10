'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FileText, Heart, MessageCircle, Bookmark, Search, Filter, Users, User, Image } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const FEATURES = [
  { icon:FileText, title:'Create Posts', desc:'Share ideas, lessons and experiences.', color:'text-[#043658] bg-[#043658]/8' },
  { icon:Heart, title:'Like Posts', desc:'Support useful community contributions.', color:'text-rose-600 bg-rose-50' },
  { icon:MessageCircle, title:'Comment', desc:'Ask questions and exchange ideas.', color:'text-blue-600 bg-blue-50' },
  { icon:Bookmark, title:'Bookmark', desc:'Save useful posts for later.', color:'text-amber-600 bg-amber-50' },
  { icon:Search, title:'Search', desc:'Find content across your communities.', color:'text-[#043658] bg-[#043658]/8' },
  { icon:Filter, title:'Filter Posts', desc:'Filter by community, category, subject.', color:'text-indigo-600 bg-indigo-50' },
  { icon:Users, title:'Join Communities', desc:'Access communities available at your level.', color:'text-[#043658] bg-[#FFC107]/15' },
  { icon:User, title:'Build Profile', desc:'Create your professional teacher identity.', color:'text-[#043658] bg-[#043658]/8' },
  { icon:Image, title:'Share Resources', desc:'Attach images, PDFs and DOCX files.', color:'text-emerald-600 bg-emerald-50' },
];

export function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Everything Teachers Need</h2>
          <p className="mt-1.5 text-sm text-slate-600">A complete set of tools for professional collaboration and knowledge sharing.</p>
        </FI>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon:Icon, title, desc, color }, i) => (
            <FI key={title} d={i*0.04}>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon className="h-4.5 w-4.5" /></div>
                <div>
                  <h3 className="text-sm font-bold text-[#043658]">{title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
