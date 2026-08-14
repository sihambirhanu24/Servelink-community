'use client';

import { useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

function FI({ children, d=0, className='' }: { children: React.ReactNode; d?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return <motion.div ref={ref} initial={{ opacity:0, y:16 }} animate={inView?{ opacity:1, y:0 }:{}} transition={{ duration:0.4, delay:d }} className={className}>{children}</motion.div>;
}

const FAQS = [
  { q:'What is ServeLink?', a:'ServeLink is a professional online community platform built specifically for teachers to connect, share resources, participate in discussions, and grow through a structured community-level system.' },
  { q:'Who can join ServeLink?', a:'Any teacher can join ServeLink. The platform is designed for educators at all stages of their career.' },
  { q:'What level do I start at?', a:'Every newly registered teacher automatically starts at LEVEL 1, which gives immediate access to their School Community.' },
  { q:'Do new teachers start at Level 0?', a:'No. New teachers automatically start at LEVEL 1. There is no Level 0. Registration immediately gives you Level 1 status and School Community access.' },
  { q:'What communities are available?', a:'ServeLink has five community types: School, Woreda, Zone, Regional, and National. Access is determined by your teacher level.' },
  { q:'How do teacher levels work?', a:'Teacher levels (1–5) determine which communities you can access. As you progress, higher communities become available.' },
  { q:'Can I create posts?', a:'Yes. You can create posts in any community you have access to.' },
  { q:'Can I upload files?', a:'Yes. You can attach images, PDFs, and DOCX documents to your posts.' },
  { q:'Can I comment and bookmark?', a:'Yes. You can comment on posts and bookmark them to save for later.' },
  { q:'Can I join multiple communities?', a:'Yes. You can join multiple communities available at your current level.' },
];

interface Props { openFaq: number | null; setOpenFaq: (v: number | null) => void; }

export function FaqSection({ openFaq, setOpenFaq }: Props) {
  return (
    <section className="bg-white py-6">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FI className="mb-4 text-center">
          <h2 className="text-2xl font-extrabold text-[#043658] lg:text-3xl">Frequently Asked Questions</h2>
        </FI>
        
        {/* 2-column grid on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {FAQS.map((faq, i) => (
            <FI key={i} d={i*0.02}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white h-full">
                <button onClick={() => setOpenFaq(openFaq===i ? null : i)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 focus:outline-none" aria-expanded={openFaq===i}>
                  <span className="text-sm font-semibold text-[#043658]">{faq.q}</span>
                  <ChevronDown className={`ml-3 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${openFaq===i?'rotate-180':''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {openFaq===i && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}>
                      <div className="border-t border-slate-100 px-4 py-3">
                        <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </FI>
          ))}
        </div>
      </div>
    </section>
  );
}
