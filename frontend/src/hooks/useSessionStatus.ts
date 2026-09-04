import { useState, useEffect } from 'react';

export type SessionRealTimeStatus = 'UPCOMING' | 'LIVE' | 'ENDED';

/**
 * Centralized session status calculation function
 * 
 * Rules:
 * - UPCOMING: currentTime < startTime
 * - LIVE: startTime <= currentTime < endTime
 * - ENDED: currentTime >= endTime
 * 
 * @param scheduledStart - ISO string or Date
 * @param durationMinutes - Duration in minutes
 * @param now - Optional current time (for testing)
 * @returns The real-time status
 */
export function getSessionStatus(
  scheduledStart: string | Date,
  durationMinutes: number,
  now: number = Date.now()
): SessionRealTimeStatus {
  if (!scheduledStart || !durationMinutes) {
    return 'ENDED'; // Default to ENDED for invalid data
  }

  const startTime = new Date(scheduledStart).getTime();
  const endTime = startTime + (durationMinutes * 60 * 1000);

  // Validate times
  if (isNaN(startTime) || isNaN(endTime) || endTime <= startTime) {
    return 'ENDED'; // Invalid data - treat as ended
  }

  if (now >= endTime) {
    return 'ENDED';
  }

  if (now >= startTime && now < endTime) {
    return 'LIVE';
  }

  return 'UPCOMING';
}

/**
 * Calculate countdown string for upcoming sessions
 * @param scheduledStart - ISO string or Date
 * @param now - Optional current time (for testing)
 * @returns Formatted countdown string or empty string if not upcoming
 */
export function getCountdown(
  scheduledStart: string | Date,
  now: number = Date.now()
): string {
  const startTime = new Date(scheduledStart).getTime();
  
  if (isNaN(startTime)) return '';
  
  const diff = startTime - now;
  
  if (diff <= 0) return ''; // Session has started or passed
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secs = Math.floor((diff % (1000 * 60)) / 1000);

  const format = (n: number) => n.toString().padStart(2, '0');
  return `${format(hours)} : ${format(mins)} : ${format(secs)}`;
}

export function useSessionStatus(session: any) {
  const [status, setStatus] = useState<SessionRealTimeStatus>('UPCOMING');
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!session) return;

    // Use backend status if it's explicitly ended/cancelled
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED' || session.status === 'REJECTED') {
      setStatus('ENDED');
      setCountdown('');
      return;
    }

    const calculateState = () => {
      const now = Date.now();
      const realTimeStatus = getSessionStatus(session.scheduledStart, session.duration, now);
      
      setStatus(realTimeStatus);
      
      if (realTimeStatus === 'UPCOMING') {
        setCountdown(getCountdown(session.scheduledStart, now));
      } else {
        setCountdown('');
      }
    };

    // Calculate immediately
    calculateState();

    // Update every second
    const interval = setInterval(calculateState, 1000);

    return () => clearInterval(interval);
  }, [session]);

  return { status, countdown };
}
