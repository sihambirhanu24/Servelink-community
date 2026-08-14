'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { GraduationCap, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Communities', href: '#communities' },
  { label: 'Features', href: '#features' },
  { label: 'Levels', href: '#levels' },
  { label: 'How It Works', href: '#how-it-works' },
];

interface Props {
  scrolled: boolean;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}

export function Navbar({ scrolled, menuOpen, setMenuOpen }: Props) {
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        {/* Logo */}
        <Link href="/landing" className="flex shrink-0 items-center gap-2.5 focus:outline-none">
          <img 
            src="/logo.png" 
            alt="ServeLink Logo" 
            className="h-10 w-10 object-contain"
          />
          <span className="text-lg font-extrabold tracking-tight text-[#043658]">ServeLink</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#043658]"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/auth/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[#043658] transition-colors hover:bg-slate-100"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="rounded-lg bg-[#FFC107] px-5 py-2.5 text-sm font-bold text-[#043658] shadow-sm transition-all hover:bg-[#e6ad00] hover:shadow-md active:scale-[0.98]"
          >
            Join ServeLink
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-[#043658] hover:bg-slate-100 lg:hidden"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="border-t border-slate-100 bg-white px-4 pb-5 shadow-lg lg:hidden"
          >
            <nav className="mt-3 space-y-0.5">
              {NAV_LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#043658]"
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Link
                href="/auth/login"
                className="rounded-xl border border-slate-200 py-2.5 text-center text-sm font-semibold text-[#043658]"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-xl bg-[#FFC107] py-2.5 text-center text-sm font-bold text-[#043658]"
              >
                Join ServeLink
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
