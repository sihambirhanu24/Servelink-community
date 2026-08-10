'use client';

import Link from 'next/link';
import {
  GraduationCap,
  Mail,
  MapPin,
  Globe,
  MessageCircle,
  Send,
  Video,
} from 'lucide-react';

const PLATFORM_LINKS = [
  { label: 'Home', href: '/landing' },
  { label: 'About ServeLink', href: '#about' },
  { label: 'Communities', href: '#communities' },
  { label: 'Features', href: '#features' },
  { label: 'Teacher Levels', href: '#levels' },
  { label: 'How It Works', href: '#how-it-works' },
];

const TEACHER_LINKS = [
  { label: 'Create Teacher Account', href: '/auth/register' },
  { label: 'Sign In', href: '/auth/login' },
  { label: 'Teacher Dashboard', href: '/access?page=dashboard' },
  { label: 'My Profile', href: '/access?page=profile' },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', href: '#' },
  { label: 'FAQ', href: '#' },
  { label: 'Contact Us', href: '#' },
  { label: 'Report a Problem', href: '#' },
];

const LEGAL_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
  { label: 'Community Guidelines', href: '#' },
];

const SOCIAL = [
  { icon: Globe, label: 'LinkedIn', href: '#' },
  { icon: MessageCircle, label: 'Facebook', href: '#' },
  { icon: Send, label: 'Telegram', href: '#' },
  { icon: Video, label: 'YouTube', href: '#' },
];

function ColHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FFC107]/70">
      {children}
    </p>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isExternal = href.startsWith('http');
  const base = 'text-[13px] text-[#CBD5E1]/70 transition-colors duration-150 hover:text-[#FFC107] leading-relaxed';
  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={base}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={base}>
      {children}
    </Link>
  );
}

export function FooterSection() {
  return (
    <footer className="bg-[#06283D]">
      {/* ── Main grid ── */}
      <div className="mx-auto max-w-7xl px-6 pb-12 pt-14 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 xl:gap-12">

          {/* Column 1 — Brand */}
          <div className="lg:col-span-1">
            <Link href="/landing" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#043658] shadow-md">
                <GraduationCap className="h-5 w-5 text-[#FFC107]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                ServeLink
              </span>
            </Link>

            <p className="mt-4 text-[13px] leading-relaxed text-[#CBD5E1]/65">
              Professional community for teachers to connect, share knowledge, exchange resources, and grow through a structured five-level community system.
            </p>

            <ul className="mt-5 space-y-2">
              <li className="flex items-center gap-2.5 text-[12px] text-[#CBD5E1]/55">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[#FFC107]/60" />
                support@servelink.com
              </li>
              <li className="flex items-center gap-2.5 text-[12px] text-[#CBD5E1]/55">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#FFC107]/60" />
                Ethiopia
              </li>
            </ul>

            <div className="mt-6 flex items-center gap-3">
              {SOCIAL.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#CBD5E1]/50 transition-all duration-150 hover:border-[#FFC107]/40 hover:bg-[#FFC107]/10 hover:text-[#FFC107]"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div>
            <ColHeading>Platform</ColHeading>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — For Teachers */}
          <div>
            <ColHeading>For Teachers</ColHeading>
            <ul className="space-y-2.5">
              {TEACHER_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Support + Legal */}
          <div>
            <ColHeading>Support</ColHeading>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>

            <p className="mb-3 mt-7 text-[10px] font-bold uppercase tracking-[0.14em] text-[#FFC107]/70">
              Legal
            </p>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <FooterLink href={href}>{label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* ── What ServeLink offers ── */}
        <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.03] px-6 py-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#FFC107]/60">
            What teachers can do on ServeLink
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {[
              'Connect with educators',
              'Join teacher communities',
              'Share lesson plans & resources',
              'Upload images, PDF and DOCX files',
              'Create and discuss posts',
              'Like, comment and bookmark posts',
              'Progress through five levels',
              'Build a professional network',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFC107]/50" />
                <span className="text-[11px] text-[#CBD5E1]/55">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row sm:px-8 lg:px-10">
          <p className="text-[12px] text-[#CBD5E1]/40">
            © 2026 ServeLink. All rights reserved.
          </p>

          <p className="text-[12px] text-[#CBD5E1]/40">
            Teachers learn better when they{' '}
            <span className="font-semibold text-[#FFC107]/70">learn together.</span>
          </p>

          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[11px] text-[#CBD5E1]/40 transition-colors hover:text-[#FFC107]"
              >
                {label.replace(' Policy', '').replace(' of Service', '')}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
