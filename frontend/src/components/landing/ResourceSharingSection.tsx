'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Image, FileText, File, Upload, CheckCircle2 } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:20 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.45, delay:d }} className={className}>{children}</motion.div>;
}

const FILES = [
  { icon:Image, label:'IMAGE', name:'Classroom Activity.jpg', size:'2.4 MB · JPG', color:'bg-blue-50 text-blue-600 border-blue-100' },
  { icon:FileText, label:'PDF', name:'Grade 8 Mathematics Lesson Plan.pdf', size:'1.1 MB · PDF', color:'bg-red-50 text-red-600 border-red-100' },
  { icon:File, label:'DOCX', name:'Science Activity Guide.docx', size:'856 KB · DOCX', color:'bg-[#043658]/8 text-[#043658] border-[#043658]/15' },
];

const STEPS = ['Choose File','Upload Resource','Attach to Post','Share with Community'];

export function ResourceSharingSection() {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <FI>
            <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Share What Works in Your Classroom</h2>
            <p className="mt-2 text-sm text-slate-600">Attach resources directly to community posts for other educators to find and use.</p>
            <div className="mt-3 space-y-1.5">
              {STEPS.map((step, i) => (
                <div key={step}>
                  <div className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50 p-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#043658] text-[10px] font-black text-white">{i+1}</div>
                    <p className="text-xs font-medium text-[#043658]">{step}</p>
                    {i===STEPS.length-1 && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" />}
                  </div>
                  {i<STEPS.length-1 && <div className="ml-3 h-2.5 w-px bg-slate-200" />}
                </div>
              ))}
            </div>
          </FI>
          <FI d={0.12}>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Supported File Types</p>
              <div className="space-y-2">
                {FILES.map(({ icon:Icon, label, name, size, color }) => (
                  <div key={name} className={`flex items-center gap-3 rounded-lg border p-3 ${color}`}>
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white"><Icon className={`h-4 w-4 ${color.split(' ')[1]}`} /></div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">{label}</p>
                      <p className="truncate text-xs font-semibold">{name}</p>
                      <p className="text-[10px] opacity-60">{size}</p>
                    </div>
                    <Upload className="ml-auto h-3.5 w-3.5 shrink-0 opacity-40" />
                  </div>
                ))}
              </div>
            </div>
          </FI>
        </div>
      </div>
    </section>
  );
}
