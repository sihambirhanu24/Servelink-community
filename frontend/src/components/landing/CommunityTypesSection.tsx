'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GraduationCap, Building2, MapPin, Globe } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const COMMUNITIES = [
  { icon:GraduationCap, name:'School Community', level:'Level 1', access:'All registered teachers', desc:'Build your first professional network with teachers in your school.', bg:'bg-[#043658]' },
  { icon:Building2, name:'Woreda Community', level:'Level 2', access:'Unlocked at Level 2', desc:'Collaborate with educators across your woreda.', bg:'bg-[#043658]/90' },
  { icon:MapPin, name:'Zone Community', level:'Level 3', access:'Unlocked at Level 3', desc:'Exchange knowledge with teachers across your zone.', bg:'bg-slate-700' },
  { icon:Globe, name:'Regional Community', level:'Level 4', access:'Unlocked at Level 4', desc:'Share ideas across your entire region.', bg:'bg-slate-600' },
  { icon:Globe, name:'National Community', level:'Level 5', access:'Unlocked at Level 5', desc:'Connect with educators from across the country.', bg:'bg-slate-500' },
];

export function CommunityTypesSection() {
  return (
    <section id="communities" className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Five Levels of Community</h2>
          <p className="mt-1.5 text-sm text-slate-600">Each level unlocks a broader network of educators.</p>
        </FI>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {COMMUNITIES.map((c, i) => (
            <FI key={c.name} d={i*0.06}>
              <div className={`flex h-full flex-col rounded-xl ${c.bg} p-3.5 hover:-translate-y-0.5 hover:shadow-lg transition-all`}>
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <c.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#FFC107]">{c.level}</span>
                <h3 className="mt-0.5 text-sm font-bold text-white">{c.name}</h3>
                <p className="mt-0.5 text-[10px] font-medium text-white/65">{c.access}</p>
                <p className="mt-1 flex-1 text-xs text-white/80">{c.desc}</p>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
