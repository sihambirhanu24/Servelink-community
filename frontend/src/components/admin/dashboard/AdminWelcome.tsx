'use client';

import { useEffect, useState } from 'react';

interface AdminWelcomeProps {
  adminName?: string;
}

export function AdminWelcome({ adminName }: AdminWelcomeProps) {
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }
  }, []);

  return (
    <div className="mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#043658]">
        {greeting}, {adminName || 'Admin'}.
      </h1>
      <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-slate-600">
        Monitor and manage the ServeLink teacher community.
      </p>
    </div>
  );
}
