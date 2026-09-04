'use client';

import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/layout';
import { LiveSessionClassroom } from '@/components/live-sessions/LiveSessionClassroom';
import { useLiveSession } from '@/services/live-sessions';
import { Loader2 } from 'lucide-react';

export default function AdminLiveSessionRoomPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session, isLoading } = useLiveSession(id, true);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <LiveSessionClassroom
        sessionId={id}
        topic={session?.topic || 'Live Session'}
        intent="host"
        isAdmin
        onLeave={() => router.push('/admin/live-sessions')}
      />
    </AdminLayout>
  );
}
