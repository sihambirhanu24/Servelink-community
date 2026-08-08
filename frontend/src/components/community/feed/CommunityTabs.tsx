'use client';

import { useState } from 'react';

const TABS = ['All Posts', 'Resources', 'Admin Hub', 'Curriculum'];

export function CommunityTabs() {
  const [active, setActive] = useState('All Posts');

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`rounded-lg px-3.5 py-1.5 text-sm transition-colors ${
              active === tab
                ? 'bg-[#043658] text-white font-medium'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400">Sort by Trending</span>
    </div>
  );
}

export default CommunityTabs;
