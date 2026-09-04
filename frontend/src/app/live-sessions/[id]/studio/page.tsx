'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LiveSessionClassroom } from '@/components/live-sessions/LiveSessionClassroom';
import { useLiveSession } from '@/services/live-sessions';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertTriangle, ArrowLeft, Video } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function LiveSessionStudioPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, isInitializing } = useAuth();
  const { data: session, isLoading, error } = useLiveSession(id, false);

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

  const isHost = session?.teacherId === user.id;
  if (!session || error || !isHost) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h2 className="mb-2 font-['Lexend'] text-lg font-bold text-[#043658]">
          You cannot open Live Studio for this session
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Only the teacher who created this live session can enter the host classroom.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="inline-flex items-center justify-center gap-2"
          onClick={() => router.push(session ? `/live-sessions/${id}` : '/live-sessions')}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  // ── GOOGLE MEET: redirect host directly to the external meeting ────────
  if (session.provider === 'GOOGLE_MEET') {
    const meetingUrl = session.meetingUrl;
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {/* Provider badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-[#1a73e8] ring-1 ring-blue-200">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
          </svg>
          Google Meet
        </div>

        <h2 className="mb-1 font-['Lexend'] text-xl font-bold text-[#043658]">{session.topic}</h2>
        <p className="mb-6 text-sm text-slate-500">
          This session uses Google Meet for video conferencing.
          Click the button below to open the meeting as the host.
        </p>

        {meetingUrl ? (
          <>
            {/* Meeting URL display */}
            <div className="mb-4 rounded-xl bg-slate-50 px-4 py-3 text-left">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">Meeting Link</p>
              <p className="truncate font-mono text-sm text-slate-600">
                {(() => { try { const u = new URL(meetingUrl); return u.host + u.pathname; } catch { return meetingUrl; } })()}
              </p>
            </div>

            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a73e8] px-4 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#1557b0] hover:-translate-y-0.5"
            >
              <Video className="h-5 w-5" />
              Open Google Meet
            </a>

            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(meetingUrl).then(() => {
                  alert('Meeting link copied to clipboard');
                }).catch(() => {});
              }}
              className="mb-6 w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Copy Meeting Link
            </button>
          </>
        ) : (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            No meeting URL is set for this session. Please edit the session and add a valid Google Meet link.
          </div>
        )}

        <Button
          type="button"
          variant="secondary"
          className="inline-flex w-full items-center justify-center gap-2"
          onClick={() => router.push(`/live-sessions/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Session
        </Button>
      </div>
    );
  }

  // ── LIVEKIT: existing classroom ────────────────────────────────────────
  return (
    <LiveSessionClassroom
      sessionId={id}
      topic={session.topic}
      intent="host"
      onLeave={() => router.push(`/live-sessions/${id}`)}
    />
  );
}
