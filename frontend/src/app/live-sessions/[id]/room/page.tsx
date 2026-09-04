'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LiveSessionClassroom } from '@/components/live-sessions/LiveSessionClassroom';
import { useLiveSession } from '@/services/live-sessions';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LiveSessionRoomPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, isInitializing } = useAuth();
  const { data: session, isLoading } = useLiveSession(id, false);

  useEffect(() => {
    if (!isInitializing && !user) {
      router.replace('/auth/login');
    }
  }, [isInitializing, user, router]);

  if (isInitializing || isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
      </div>
    );
  }

  // Google Meet sessions are joined via the session detail page's external link.
  // If someone lands here directly for a Google Meet session, redirect them back.
  if (session?.provider === 'GOOGLE_MEET') {
    if (session.meetingUrl) {
      window.open(session.meetingUrl, '_blank', 'noopener,noreferrer');
    }
    router.replace(`/live-sessions/${id}`);
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
      </div>
    );
  }

  const isHost = session?.teacherId === user.id;

  return (
    <LiveSessionClassroom
      sessionId={id}
      topic={session?.topic || 'Live Session'}
      intent={isHost ? 'host' : 'participant'}
      onLeave={() => router.push(`/live-sessions/${id}`)}
    />
  );
}
