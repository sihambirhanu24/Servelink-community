'use client';

import React, { useState } from 'react';
import { useLiveSessions, useCreateLiveSession } from '@/services/live-sessions';
import { paymentsApi } from '@/services/payments';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Calendar, Clock, Video, Plus, Info, CreditCard, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function TeacherLiveSessionsPage() {
  const { data: sessions, isLoading } = useLiveSessions();
  const router = useRouter();
  const { token, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState<string | null>(null);
  const createMutation = useCreateLiveSession();

  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createMutation.mutateAsync({
      topic: formData.get('topic') as string,
      description: formData.get('description') as string,
      scheduledStart: formData.get('scheduledStart') as string,
      duration: parseInt(formData.get('duration') as string),
      isPaid: formData.get('isPaid') === 'true',
      price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
      maxParticipants: formData.get('maxParticipants') ? parseInt(formData.get('maxParticipants') as string) : undefined,
    });
    setIsModalOpen(false);
  };

  const handlePayment = async (sessionId: string, price: number) => {
    if (!token) return;
    try {
      setProcessingPayment(sessionId);
      const result = await paymentsApi.createPayment({
        liveSessionId: sessionId,
        amount: price,
        currency: 'ETB',
        paymentMethod: 'CHAPA',
      }, token);
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      if (error.response?.status === 409) {
        alert('You already have a payment for this session');
      } else {
        alert('Failed to initialize payment: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setProcessingPayment(null);
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
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Sessions</h1>
          <p className="text-muted-foreground mt-1">Request and manage your video sessions with administrators.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Request Session
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading sessions...</div>
      ) : sessions?.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <Video className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold">No Sessions Yet</h3>
          <p className="text-muted-foreground mb-4">You haven't requested any live sessions.</p>
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Request Your First Session</Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions?.map(session => (
            <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow p-0">
              <div className="p-4 border-b bg-muted/20">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="text-lg font-semibold line-clamp-1">{session.topic}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(session.status)}`}>
                    {session.status}
                  </span>
                </div>
                {session.admin && (
                  <p className="text-sm text-gray-500">With {session.admin.name}</p>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="mr-2 h-4 w-4" />
                  {format(new Date(session.scheduledStart), 'PPP')}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="mr-2 h-4 w-4" />
                  {format(new Date(session.scheduledStart), 'p')} ({session.duration} min)
                </div>
                {session.isPaid && session.price && (
                  <div className="flex items-center text-sm font-semibold text-[#043658]">
                    <CreditCard className="mr-2 h-4 w-4" />
                    {session.price} ETB
                  </div>
                )}
                {session.status === 'REJECTED' && session.rejectionReason && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded-md flex items-start mt-2">
                    <Info className="h-4 w-4 mr-1 shrink-0 mt-0.5" />
                    <span>{session.rejectionReason}</span>
                  </div>
                )}
                <div className="pt-2">
                  {session.isPaid && session.price && session.teacherId !== user?.id ? (
                    <Button 
                      className="w-full text-center flex justify-center gap-2"
                      disabled={processingPayment === session.id || session.status !== 'APPROVED'}
                      onClick={() => handlePayment(session.id, session.price!)}
                    >
                      {processingPayment === session.id ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Pay {session.price} ETB
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      className="w-full text-center flex justify-center" 
                      variant={session.status === 'LIVE' || session.status === 'APPROVED' ? 'primary' : 'secondary'}
                      disabled={!['LIVE', 'APPROVED'].includes(session.status)}
                      onClick={() => router.push(`/live-sessions/${session.id}`)}
                    >
                      Join Session
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 p-0 overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Request Live Session</h2>
              <p className="text-gray-500 text-sm mt-1">Select a topic and time for your meeting with an admin.</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic *</label>
                  <input required name="topic" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="e.g., Curriculum Guidance" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea name="description" className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" placeholder="Briefly describe what you'd like to discuss..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Session Type *</label>
                    <select required name="isPaid" defaultValue="false" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                      <option value="false">Free</option>
                      <option value="true">Paid</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price (Birr)</label>
                    <input type="number" name="price" min="0" placeholder="e.g. 150" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Participants</label>
                    <input type="number" name="maxParticipants" min="1" placeholder="e.g. 20" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration (min) *</label>
                    <select required name="duration" defaultValue="30" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
                      <option value="15">15 mins</option>
                      <option value="30">30 mins</option>
                      <option value="45">45 mins</option>
                      <option value="60">60 mins</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date & Time *</label>
                  <input required type="datetime-local" name="scheduledStart" className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button type="submit" variant="primary" disabled={createMutation.isPending}>Submit Request</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
