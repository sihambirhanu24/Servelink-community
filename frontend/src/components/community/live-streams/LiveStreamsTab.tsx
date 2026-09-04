"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Video, Calendar as CalendarIcon, PlayCircle, Plus, Search, AlertTriangle, Loader2 } from "lucide-react";
import { LiveSessionCard, Session } from "@/components/live-sessions/LiveSessionCard";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { toast } from "sonner";
import { CreateLiveSessionModal } from "@/components/live-sessions/CreateLiveSessionModal";
import { CancelSessionModal } from "@/components/live-sessions/CancelSessionModal";
import { getSessionStatus } from "@/hooks/useSessionStatus";
import { useCancelLiveSession, useDeleteLiveSession } from "@/services/live-sessions";

export function LiveStreamsTab() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mySessionsTab, setMySessionsTab] = useState<"upcoming" | "live" | "completed">("upcoming");
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null);
  const cancelMutation = useCancelLiveSession();
  const deleteMutation = useDeleteLiveSession();

  const { data: sessions = [], isLoading, isError, error, refetch } = useQuery<Session[], any>({
    queryKey: ["discoverable-live-sessions"],
    queryFn: async () => {
      const res = await api.get("/live-sessions/discover");
      return res.data;
    },
    refetchInterval: 30000,
  });

  const handleJoin = (session: { id: string; teacherId?: string; teacher?: { id?: string }; scheduledStart: string; duration: number }) => {
    const isHost = session.teacher?.id === user?.id || session.teacherId === user?.id;
    if (isHost) {
      router.push(`/live-sessions/${session.id}/studio`);
      return;
    }
    router.push(`/live-sessions/${session.id}`);
  };

  const handleRemind = (id: string) => {
    api.post(`/live-sessions/${id}/remind`)
      .then(() => toast.success("Reminder set successfully!"))
      .catch((err) => toast.error(err.response?.data?.message || "Failed to set reminder"));
  };

  const filteredSessions = sessions.filter(s => {
    if (search && !s.topic.toLowerCase().includes(search.toLowerCase()) && 
        !(s.teacher?.firstName || "").toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filter === "free" && s.isPaid) return false;
    if (filter === "paid" && !s.isPaid) return false;
    
    // Use real-time status for filtering
    const realTimeStatus = getSessionStatus(s.scheduledStart, s.duration);
    
    if (filter === "live now" && realTimeStatus !== "LIVE") return false;
    if (filter === "upcoming" && realTimeStatus !== "UPCOMING") return false;
    if (filter === "past" && realTimeStatus !== "ENDED") return false;
    
    return true;
  });

  // Use real-time status for section grouping
  const liveNow = filteredSessions.filter(s => getSessionStatus(s.scheduledStart, s.duration) === "LIVE");
  const upcoming = filteredSessions.filter(s => getSessionStatus(s.scheduledStart, s.duration) === "UPCOMING");
  const past = filteredSessions.filter(s => getSessionStatus(s.scheduledStart, s.duration) === "ENDED");

  const mySessions = filteredSessions.filter(s => s.teacher?.id === user?.id);
  const myLive = mySessions.filter(s => getSessionStatus(s.scheduledStart, s.duration) === "LIVE");
  const myUpcoming = mySessions.filter(s => getSessionStatus(s.scheduledStart, s.duration) === "UPCOMING");
  const myCompleted = mySessions.filter(s => getSessionStatus(s.scheduledStart, s.duration) === "ENDED");
  
  const displayMySessions = mySessionsTab === "upcoming" ? myUpcoming : mySessionsTab === "live" ? myLive : myCompleted;

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
        <p className="text-[13px] text-slate-500">Loading live sessions...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center space-y-3">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm font-medium text-slate-700">Unable to load live sessions.</p>
        <p className="text-xs text-red-500 max-w-sm text-center">{error?.message || JSON.stringify(error?.response?.data || error)}</p>
        <button onClick={() => refetch()} className="rounded-lg bg-slate-100 px-4 py-1.5 text-[13px] font-semibold hover:bg-slate-200">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* ── COMPACT HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[18px] bg-white border border-slate-200 p-5 shadow-[0_2px_8px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <h1 className="font-['Lexend'] text-lg font-bold text-[#043658]">Live Sessions</h1>
          </div>
          <p className="text-[13px] text-slate-500">
            Learn, teach, and connect with educators in real time.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              document.getElementById("my-sessions")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 hover:text-[#043658] hover:bg-slate-50 rounded-xl transition-colors"
          >
            My Sessions
          </button>
          
          <button
            onClick={() => {
              if (!user?.verified) {
                toast.error("Live session creation is available to verified teachers.");
                return;
              }
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-[#FFC107] px-4 py-2 text-[13px] font-semibold text-[#043658] shadow-sm transition-colors hover:bg-[#ffcd38]"
          >
            <Plus className="h-4 w-4" />
            Create Live Session
          </button>
        </div>
      </div>

      {/* ── COMPACT CONTROL BAR ── */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex items-center gap-1.5 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
          {["all", "live now", "upcoming", "past"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium capitalize whitespace-nowrap transition-colors ${
                filter === f ? "bg-[#043658] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="w-px h-5 bg-slate-200 mx-1"></div>
          {["free", "paid"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-medium capitalize whitespace-nowrap transition-colors ${
                filter === f ? "bg-[#043658] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search live sessions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-[#043658] focus:ring-1 focus:ring-[#043658]"
            />
          </div>
          <select className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-1.5 text-[13px] text-slate-600 focus:outline-none focus:border-[#043658]">
            <option>Soonest</option>
            <option>Newest</option>
            <option>Most Popular</option>
          </select>
        </div>
      </div>

      {/* ── LIVE NOW ── */}
      {(filter === "all" || filter === "live now" || filter === "free" || filter === "paid") && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-red-50 text-red-600">
              <Video className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-['Lexend'] text-sm font-semibold text-[#043658]">Live Now</h2>
          </div>
          
          {liveNow.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveNow.map(session => (
                <LiveSessionCard 
                  key={session.id} 
                  session={session} 
                  onJoin={() => handleJoin(session)}
                  onRegister={() => handleJoin(session)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 text-slate-500">
                <Video className="h-4 w-4" />
                <span className="text-[13px] font-medium">Nobody is live right now</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── UPCOMING SESSIONS ── */}
      {(filter === "all" || filter === "upcoming" || filter === "free" || filter === "paid") && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-[#FFC107]/10 text-[#b58800]">
              <CalendarIcon className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-['Lexend'] text-sm font-semibold text-[#043658]">Upcoming Sessions</h2>
          </div>
          
          {upcoming.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map(session => (
                <LiveSessionCard 
                  key={session.id} 
                  session={session} 
                  onJoin={() => handleJoin(session)}
                  onRemind={() => handleRemind(session.id)}
                  onRegister={() => handleJoin(session)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center flex flex-col items-center justify-center">
              <span className="text-[13px] font-medium text-slate-500">No upcoming live sessions</span>
            </div>
          )}
        </section>
      )}

      {/* ── PAST SESSIONS ── */}
      {(filter === "all" || filter === "past") && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-slate-600">
              <PlayCircle className="h-3.5 w-3.5" />
            </div>
            <h2 className="font-['Lexend'] text-sm font-semibold text-[#043658]">Past Sessions</h2>
          </div>
          
          {past.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.slice(0, 6).map(session => (
                <LiveSessionCard 
                  key={session.id} 
                  session={session} 
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-dashed border-slate-200 bg-slate-50/50 py-6 text-center flex flex-col items-center justify-center">
              <span className="text-[13px] font-medium text-slate-500">No past sessions</span>
            </div>
          )}
        </section>
      )}

      {/* ── MY SESSIONS ── */}
      <section id="my-sessions" className="rounded-[18px] border border-slate-200 bg-white p-5 shadow-[0_2px_8px_rgb(0,0,0,0.02)] mt-8">
        <h2 className="font-['Lexend'] text-base font-semibold text-[#043658] mb-3">My Live Sessions</h2>
        
        <div className="mb-4 flex gap-4 border-b border-slate-100">
          {(["upcoming", "live", "completed"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setMySessionsTab(t)}
              className={`pb-2 text-[13px] font-medium capitalize transition-colors border-b-2 ${
                mySessionsTab === t
                  ? "border-[#043658] text-[#043658]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {displayMySessions.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayMySessions.map(session => (
              <LiveSessionCard 
                key={session.id} 
                session={session} 
                isOwner
                onJoin={() => handleJoin(session)}
                onCancel={() => setCancelTarget(session)}
                onDelete={() => {
                  if (window.confirm('Delete this session? This cannot be undone.')) {
                    deleteMutation.mutate(session.id);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-[13px] font-medium text-slate-500">
            You have no {mySessionsTab} sessions.
          </div>
        )}
      </section>

      {cancelTarget && (
        <CancelSessionModal
          open={!!cancelTarget}
          topic={cancelTarget.topic}
          paidParticipants={cancelTarget.hostActions?.paidParticipants || 0}
          totalCollected={cancelTarget.hostActions?.totalCollected || 0}
          refundDisclaimer="Refunds are requested through Chapa and are only marked refunded after Chapa confirms them."
          isPending={cancelMutation.isPending}
          onKeep={() => setCancelTarget(null)}
          onConfirm={async () => {
            await cancelMutation.mutateAsync(cancelTarget.id);
            setCancelTarget(null);
            refetch();
          }}
        />
      )}

      {/* Modal */}
      {isCreateModalOpen && (
        <CreateLiveSessionModal 
          isOpen={isCreateModalOpen} 
          onClose={() => setIsCreateModalOpen(false)} 
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
