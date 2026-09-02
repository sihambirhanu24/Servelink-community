'use client';

import React, { useState } from 'react';
import { useLiveSessions, useApproveLiveSession, useRejectLiveSession, useRescheduleLiveSession, LiveSession } from '@/services/live-sessions';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Calendar, Clock, User, Check, X, CalendarClock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function AdminLiveSessionsPage() {
  const { data: sessions, isLoading } = useLiveSessions(true);
  const router = useRouter();
  
  const approveMutation = useApproveLiveSession();
  const rejectMutation = useRejectLiveSession();
  const rescheduleMutation = useRescheduleLiveSession();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync({ id });
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectingId) {
      await rejectMutation.mutateAsync({ id: rejectingId, reason: rejectReason });
      setRejectingId(null);
      setRejectReason('');
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reschedulingId) {
      await rescheduleMutation.mutateAsync({ id: reschedulingId, scheduledStart: newDate });
      setReschedulingId(null);
      setNewDate('');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REQUESTED': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LIVE': return 'bg-red-100 text-red-800 border-red-200 animate-pulse';
      case 'REJECTED': return 'bg-red-50 text-red-600 border-red-100';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Live Session Management</h1>
        <p className="text-muted-foreground mt-1">Review and manage teacher video session requests.</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading sessions...</div>
      ) : (
        <div className="grid gap-6">
          {['REQUESTED', 'RESCHEDULED', 'APPROVED', 'LIVE', 'COMPLETED'].map(sectionStatus => {
            const sectionSessions = sessions?.filter(s => 
              sectionStatus === 'REQUESTED' 
                ? (s.status === 'REQUESTED' || s.status === 'RESCHEDULED') 
                : sectionStatus === 'RESCHEDULED' 
                  ? false // grouped with requested
                  : s.status === sectionStatus
            ) || [];

            if (sectionSessions.length === 0 && sectionStatus !== 'REQUESTED') return null;

            return (
              <div key={sectionStatus}>
                {sectionStatus !== 'RESCHEDULED' && (
                  <h2 className="text-xl font-semibold mb-4 capitalize">{sectionStatus.toLowerCase()} Sessions</h2>
                )}
                {sectionStatus === 'REQUESTED' && sectionSessions.length === 0 && (
                   <div className="p-8 text-center bg-muted/20 border rounded-lg text-muted-foreground">No pending requests.</div>
                )}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sectionSessions.map(session => (
                    <Card key={session.id} className="overflow-hidden p-0">
                      <div className="p-4 border-b bg-muted/10">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-lg font-semibold line-clamp-1">{session.topic}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(session.status)}`}>{session.status}</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                            {session.teacher?.profileImage ? (
                              <img src={session.teacher.profileImage} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{session.teacher?.firstName} {session.teacher?.lastName}</p>
                            <p className="text-xs text-gray-500 truncate">{session.teacher?.email}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                            {format(new Date(session.scheduledStart), 'PPP')}
                          </div>
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-gray-500" />
                            {format(new Date(session.scheduledStart), 'p')} ({session.duration}m)
                          </div>
                        </div>

                        {session.description && (
                          <div className="text-sm bg-gray-50 p-2 rounded line-clamp-3">
                            <span className="font-medium text-xs text-gray-500 uppercase block mb-1">Description</span>
                            {session.description}
                          </div>
                        )}

                        <div className="pt-2 flex flex-col gap-2">
                          {(session.status === 'REQUESTED' || session.status === 'RESCHEDULED') && (
                            <div className="flex gap-2">
                              <Button className="flex-1 bg-green-600 hover:bg-green-700 !py-2 !px-3 !text-sm flex justify-center items-center" onClick={() => handleApprove(session.id)}>
                                <Check className="h-4 w-4 mr-1" /> Approve
                              </Button>
                              <Button variant="secondary" className="!py-2 !px-3 text-red-600 bg-red-100 hover:bg-red-200 border-red-200" onClick={() => setRejectingId(session.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                              <Button variant="secondary" className="!py-2 !px-3" title="Reschedule" onClick={() => setReschedulingId(session.id)}>
                                <CalendarClock className="h-4 w-4" />
                              </Button>
                            </div>
                          )}

                          {['APPROVED', 'LIVE'].includes(session.status) && (
                            <Button 
                              className="w-full flex justify-center text-center" 
                              onClick={() => router.push(`/live-sessions/${session.id}`)}
                            >
                              View Session
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm p-0 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Reject Session</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleReject} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason for rejection *</label>
                  <textarea 
                    required 
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm" 
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setRejectingId(null)}>Cancel</Button>
                  <Button type="submit" variant="primary" className="!bg-red-600">Reject Request</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-sm p-0 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Reschedule Session</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleReschedule} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Date & Time *</label>
                  <input 
                    type="datetime-local" 
                    required 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border px-3 py-2 text-sm" 
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={() => setReschedulingId(null)}>Cancel</Button>
                  <Button type="submit">Reschedule</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
