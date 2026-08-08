import type { ReactNode } from 'react';

interface AuthHeroPanelProps {
  eyebrow: string;
  headline: ReactNode;
  description: string;
  stats: { value: string; label: string }[];
}

// This is the dark navy panel from the mockup — shared between
// login and register so the two pages read as one continuous brand
// moment, not two disconnected screens.
export function AuthHeroPanel({ eyebrow, headline, description, stats }: AuthHeroPanelProps) {
  return (
    <div
      className="relative hidden items-center justify-center overflow-hidden bg-cover bg-center p-16 text-center text-white lg:flex"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200')",
      }}
    >
      <div className="absolute inset-0 bg-blue-900/60" />

      <div className="relative z-10 w-full max-w-lg">
        <span className="inline-flex rounded-full bg-[#FFC107] px-4 py-2 text-sm font-semibold text-[#043658] shadow-md">
          {eyebrow}
        </span>

        <h1 className="mt-6 text-6xl font-bold">
          {headline}
        </h1>
        <p className="mt-6 text-lg text-blue-100">{description}</p>

        <div className="mt-10 flex justify-center gap-10">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
