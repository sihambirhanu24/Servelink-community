'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Lightbulb, BookOpen, HelpCircle, Users, Bookmark, TrendingUp } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const BENEFITS = [
  { icon:Lightbulb, title:'Find Ideas', desc:'Discover practical teaching approaches from educators around you.', color:'bg-[#FFC107]/15 text-[#043658]' },
  { icon:BookOpen, title:'Discover Resources', desc:'Find lesson plans and materials shared by other teachers.', color:'bg-[#043658]/8 text-[#043658]' },
  { icon:HelpCircle, title:'Ask Questions', desc:'Get perspectives from experienced educators.', color:'bg-blue-50 text-blue-700' },
  { icon:Users, title:'Build Connections', desc:'Expand your professional network from school to national.', color:'bg-emerald-50 text-emerald-700' },
  { icon:Bookmark, title:'Save Knowledge', desc:'Bookmark posts and resources for whenever you need.', color:'bg-amber-50 text-amber-700' },
  { icon:TrendingUp, title:'Grow Professionally', desc:'Progress through the community system and expand your reach.', color:'bg-[#043658]/10 text-[#043658]' },
];

export function BenefitsSection() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FI className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Why Teachers Join ServeLink</h2>
          <p className="mt-1.5 text-sm text-slate-600">Real value for real educators — from day one.</p>
        </FI>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon:Icon, title, desc, color }, i) => (
            <FI key={title} d={i*0.06}>
              <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
                <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}><Icon className="h-4.5 w-4.5" /></div>
                <h3 className="mb-1 text-sm font-bold text-[#043658]">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-600">{desc}</p>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
