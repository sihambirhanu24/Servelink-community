import { useState, useEffect } from 'react';

export type SessionRealTimeStatus = 'UPCOMING' | 'LIVE' | 'ENDED';

export function useSessionStatus(session: any) {
  const [status, setStatus] = useState<SessionRealTimeStatus>('UPCOMING');
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!session) return;

    // Use backend status if it's already explicitly ended/cancelled
    if (session.status === 'COMPLETED' || session.status === 'CANCELLED') {
      setStatus('ENDED');
      setCountdown('');
      return;
    }

    const scheduledStart = new Date(session.scheduledStart).getTime();
    const durationMs = (session.duration || 60) * 60 * 1000;
    const endTime = scheduledStart + durationMs;

    const calculateState = () => {
      const now = Date.now();

      if (now >= endTime) {
        setStatus('ENDED');
        setCountdown('');
        return;
      }

      if (now >= scheduledStart && now < endTime) {
        setStatus('LIVE');
        setCountdown('');
        return;
      }

      // UPCOMING
      setStatus('UPCOMING');
      
      const diff = scheduledStart - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const format = (n: number) => n.toString().padStart(2, '0');
      setCountdown(`${format(hours)} : ${format(mins)} : ${format(secs)}`);
    };

    // Calculate immediately
    calculateState();

    // Update every second
    const interval = setInterval(calculateState, 1000);

    return () => clearInterval(interval);
  }, [session]);

  return { status, countdown };
}
