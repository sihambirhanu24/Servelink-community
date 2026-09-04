'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useConnectionState,
  useParticipants,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import { ConnectionState, RoomEvent, Track } from 'livekit-client';
import { isAxiosError } from 'axios';
import { Loader2, PhoneOff, Users, Wifi, WifiOff, AlertTriangle, MicOff, VideoOff, UserX } from 'lucide-react';
import { api, adminApi } from '@/lib/axios';
import { toast } from 'sonner';
import type { LiveKitRole, LiveKitTokenResponse } from '@/services/live-sessions';
import Button from '@/components/ui/Button';
import '@livekit/components-styles';

interface LiveSessionClassroomProps {
  sessionId: string;
  topic: string;
  intent: 'host' | 'participant';
  isAdmin?: boolean;
  onLeave: () => void;
}

function safeHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function nestErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;
  const message = error.response?.data?.message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((item) => typeof item === 'string').join(', ');
  return fallback;
}

export function LiveSessionClassroom({
  sessionId,
  topic,
  intent,
  isAdmin,
  onLeave,
}: LiveSessionClassroomProps) {
  const [connectError, setConnectError] = useState<string | null>(null);
  const [roomInstance, setRoomInstance] = useState(0);
  const client = isAdmin ? adminApi : api;
  const path =
    intent === 'host'
      ? `/live-sessions/${sessionId}/livekit/host-token`
      : `/live-sessions/${sessionId}/livekit/token`;

  const tokenQuery = useQuery({
    queryKey: ['livekit-token', sessionId, intent, isAdmin],
    queryFn: async () => {
      try {
        const { data } = await client.post<LiveKitTokenResponse>(path);
        if (!data?.token || !data?.serverUrl) {
          throw new Error('The server did not return a LiveKit token.');
        }
        if (intent === 'host' && data.role !== 'HOST') {
          throw new Error('Only the session host can open Live Studio.');
        }
        return data;
      } catch (err: unknown) {
        if (err instanceof Error && err.message.startsWith('The server did not')) throw err;
        if (err instanceof Error && err.message.startsWith('Only the session host')) throw err;
        throw new Error(nestErrorMessage(err, 'Unable to join this live session.'));
      }
    },
    retry: false,
  });

  const retryToken = () => {
    setConnectError(null);
    setRoomInstance((value) => value + 1);
    void tokenQuery.refetch();
  };

  if (tokenQuery.isPending) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
        <p className="text-sm font-medium text-slate-500">Connecting to live classroom...</p>
      </div>
    );
  }

  const queryError =
    tokenQuery.error instanceof Error
      ? tokenQuery.error.message
      : 'Unable to join this live session.';

  if (tokenQuery.isError || !tokenQuery.data) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h2 className="mb-2 font-['Lexend'] text-lg font-bold text-[#043658]">
          Unable to connect to the live session.
        </h2>
        <p className="mb-6 text-sm text-slate-500">{queryError}</p>
        <div className="flex justify-center gap-2">
          <Button type="button" onClick={retryToken}>
            Retry
          </Button>
          <Button type="button" variant="secondary" onClick={onLeave}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  const tokenPayload = tokenQuery.data;
  const isHost = tokenPayload.role === 'HOST';

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[32rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#043658]">
      {connectError && (
        <div className="flex items-center justify-between gap-3 bg-red-50 px-4 py-2 text-sm text-red-800">
          <span>Connection lost. {connectError}</span>
          <button type="button" className="font-semibold underline" onClick={retryToken}>
            Retry
          </button>
        </div>
      )}
      <LiveKitRoom
        key={roomInstance}
        data-lk-theme="default"
        token={tokenPayload.token}
        serverUrl={tokenPayload.serverUrl}
        connect
        audio={isHost}
        video={isHost}
        options={{ adaptiveStream: true, dynacast: true }}
        style={{ height: '100%' }}
        className="flex h-full min-h-0 flex-col"
        onConnected={() => {
          if (process.env.NODE_ENV !== 'production') {
            console.info('[LiveKit] connected', {
              host: safeHost(tokenPayload.serverUrl),
              room: tokenPayload.roomName,
              role: tokenPayload.role,
              tokenLength: tokenPayload.token.length,
              at: new Date().toISOString(),
            });
          }
        }}
        onError={(err) => {
          console.error('[LiveKit] connection error', {
            host: safeHost(tokenPayload.serverUrl),
            room: tokenPayload.roomName,
            role: tokenPayload.role,
            tokenLength: tokenPayload.token.length,
            at: new Date().toISOString(),
            error: err,
          });
          setConnectError(err.message || 'LiveKit connection failed.');
        }}
        onMediaDeviceFailure={(failure) => {
          toast.error(
            failure === 'PermissionDenied'
              ? 'Camera access is blocked. Please allow camera access in your browser settings.'
              : 'A camera or microphone is unavailable.',
          );
        }}
      >
        <ClassroomInner
          topic={topic}
          sessionId={sessionId}
          isHost={isHost}
          isAdmin={isAdmin}
          roomName={tokenPayload.roomName}
          role={tokenPayload.role}
          onLeave={onLeave}
        />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  );
}

function ClassroomInner({
  topic,
  sessionId,
  isHost,
  isAdmin,
  roomName,
  role,
  onLeave,
}: {
  topic: string;
  sessionId: string;
  isHost: boolean;
  isAdmin?: boolean;
  roomName: string;
  role: LiveKitRole;
  onLeave: () => void;
}) {
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const [ending, setEnding] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );

  useEffect(() => {
    const onDenied = () =>
      setDeviceError('Camera access is blocked. Please allow camera access in your browser settings.');
    room.on(RoomEvent.MediaDevicesError, onDenied);
    return () => {
      room.off(RoomEvent.MediaDevicesError, onDenied);
    };
  }, [room]);

  const statusLabel = useMemo(() => {
    switch (connectionState) {
      case ConnectionState.Connecting:
        return 'Connecting to live classroom...';
      case ConnectionState.Reconnecting:
        return 'Reconnecting...';
      case ConnectionState.SignalReconnecting:
        return 'Reconnecting...';
      case ConnectionState.Disconnected:
        return 'Connection lost.';
      case ConnectionState.Connected:
        return isHost ? 'You are live' : 'Connected';
      default:
        return 'Connecting to live classroom...';
    }
  }, [connectionState, isHost]);

  const handleEnd = async () => {
    if (!window.confirm('End this live session for everyone?')) return;
    setEnding(true);
    try {
      const client = isAdmin ? adminApi : api;
      await client.post(`/live-sessions/${sessionId}/end`);
      toast.success('Session ended');
      await room.disconnect();
      onLeave();
    } catch (err: unknown) {
      toast.error(nestErrorMessage(err, 'Could not end the session'));
    } finally {
      setEnding(false);
    }
  };

  const removeParticipant = async (identity: string) => {
    try {
      const client = isAdmin ? adminApi : api;
      await client.post(`/live-sessions/${sessionId}/livekit/participants/${encodeURIComponent(identity)}/remove`);
      toast.success('Participant removed');
    } catch (err: unknown) {
      toast.error(nestErrorMessage(err, 'Could not remove participant'));
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#FFC107]">
            {isHost ? 'Host studio' : 'Live session'}
          </p>
          <h1 className="font-['Lexend'] text-lg font-semibold">{topic}</h1>
          <p className="text-[11px] text-white/60">
            {role} · {roomName}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            {connectionState === ConnectionState.Connected ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-300" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-300" />
            )}
            {statusLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <Users className="h-3.5 w-3.5" />
            {participants.length}
          </span>
        </div>
      </div>

      {deviceError && (
        <div className="mx-4 mb-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">{deviceError}</div>
      )}

      <div className="relative min-h-0 flex-1 bg-black">
        {connectionState === ConnectionState.Connecting ||
        connectionState === ConnectionState.Reconnecting ||
        connectionState === ConnectionState.SignalReconnecting ? (
          <div className="flex h-full items-center justify-center text-white">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {statusLabel}
          </div>
        ) : connectionState === ConnectionState.Disconnected ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-white">
            <p>Connection lost.</p>
            <p className="text-sm text-white/70">Use Retry on the banner, or leave and re-enter Live Studio.</p>
          </div>
        ) : (
          <GridLayout tracks={tracks} className="h-full w-full">
            <ParticipantTile />
          </GridLayout>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 bg-[#032742] p-3 text-white lg:flex-row lg:items-center lg:justify-between">
        {isHost ? (
          <ControlBar
            variation="minimal"
            controls={{ camera: true, microphone: true, screenShare: true, leave: false }}
          />
        ) : (
          <p className="text-xs text-white/70">You are watching as a participant. Camera and microphone are off.</p>
        )}

        <div className="flex items-center gap-2">
          {isHost && (
            <button
              type="button"
              onClick={() => void handleEnd()}
              disabled={ending}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
            >
              {ending ? 'Ending...' : 'End Session'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              void room.disconnect();
              onLeave();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20"
          >
            <PhoneOff className="h-4 w-4" /> Leave
          </button>
        </div>
      </div>

      {isHost && (
        <div className="max-h-40 overflow-y-auto border-t border-white/10 bg-[#021a2c] px-4 py-3 text-white">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">Participants</p>
          <ul className="space-y-1.5 text-sm">
            {participants.map((participant) => (
              <li key={participant.identity} className="flex items-center justify-between">
                <span>
                  {participant.name || participant.identity}
                  {participant.identity === localParticipant.identity ? ' (you)' : ''}
                </span>
                <span className="flex items-center gap-2 text-xs text-white/60">
                  {!participant.isMicrophoneEnabled && <MicOff className="h-3.5 w-3.5" />}
                  {!participant.isCameraEnabled && <VideoOff className="h-3.5 w-3.5" />}
                  {participant.identity !== localParticipant.identity && (
                    <button
                      type="button"
                      onClick={() => void removeParticipant(participant.identity)}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 hover:bg-red-500/80"
                    >
                      <UserX className="h-3 w-3" /> Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
