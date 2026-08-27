"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Clock, CheckCircle2, Trophy, Lock, ThumbsUp,
  MessageCircle, Send, Loader2, Tag, Eye, AlertCircle, HelpCircle,
} from "lucide-react";
import { DashboardSidebar } from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { useAuth } from "@/context/AuthContext";
import { useVerification } from "@/hooks/useVerification";
import { useQuestion, useAnswers, useSubmitAnswer, useToggleHelpful, useSelectBestAnswer } from "@/hooks/useQuestions";
import { toast } from "sonner";
import type { Answer } from "@/services/questions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelLabel(raw: string) {
  return String(raw).replace(/^LEVEL_/, "Level ").replace(/_/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function useCountdown(deadline: string | null | undefined) {
  const [remaining, setRemaining] = useState<string>("");
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!deadline) { setRemaining("No deadline"); return; }

    function tick() {
      const ms = new Date(deadline!).getTime() - Date.now();
      if (ms <= 0) { setRemaining("Closed"); setExpired(true); return; }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      if (h > 24) setRemaining(`${Math.floor(h / 24)}d ${h % 24}h remaining`);
      else if (h > 0) setRemaining(`${h}h ${m}m ${s}s remaining`);
      else setRemaining(`${m}m ${s}s remaining`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return { remaining, expired };
}

// ─── Status header ────────────────────────────────────────────────────────────

function QuestionStatusBar({
  status, deadline, answerCount, isAsker,
}: {
  status: string; deadline?: string | null; answerCount: number; isAsker: boolean;
}) {
  const { remaining, expired } = useCountdown(deadline);

  if (status === "SOLVED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-white px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
          <Trophy className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">✓ Solved — Best Answer Selected</p>
          <p className="text-xs font-medium text-emerald-600/80 mt-0.5">All answers are now visible.</p>
        </div>
      </div>
    );
  }

  if (status === "CLOSED") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200/60 bg-gradient-to-r from-slate-50 to-white px-5 py-4 shadow-sm">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-inner">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">✓ Question Closed</p>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Answers are now visible.
            {isAsker && " You can select the Best Answer below."}
          </p>
        </div>
      </div>
    );
  }

  // OPEN
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-white px-5 py-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-amber-100/50 blur-xl" />
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100/80 text-amber-600 shadow-inner relative">
        <Clock className="h-5 w-5 animate-pulse" />
      </div>
      <div className="flex-1 relative">
        <p className="text-sm font-bold text-amber-800 tracking-tight">⏱ {remaining}</p>
        <p className="text-xs font-semibold text-amber-600/90 mt-0.5 flex items-center gap-1.5">
          {answerCount > 0
            ? <><Lock className="h-3 w-3" /> {answerCount} answer{answerCount > 1 ? "s" : ""} securely hidden until time expires.</>
            : "Answers will be securely hidden until the question closes."}
        </p>
      </div>
    </div>
  );
}

// ─── Answer card ─────────────────────────────────────────────────────────────

function AnswerCard({
  answer,
  isAsker,
  questionStatus,
  onHelpful,
  onBestAnswer,
  onUnmarkBestAnswer,
  isPendingHelpful,
  isPendingBestAnswer,
  currentUserId,
}: {
  answer: Answer;
  isAsker: boolean;
  questionStatus: string;
  onHelpful: (id: string) => void;
  onBestAnswer: (id: string) => void;
  onUnmarkBestAnswer: (id: string) => void;
  isPendingHelpful: boolean;
  isPendingBestAnswer: boolean;
  currentUserId?: string;
}) {
  const isMine = answer.teacher.id === currentUserId;
  const canSelectBest = isAsker && questionStatus === "CLOSED" && !answer.isAccepted && !isMine;
  const canUnmarkBest = isAsker && answer.isAccepted;
  const canVoteHelpful = !isMine && questionStatus !== "OPEN" && !answer.isAccepted;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 ${
      answer.isAccepted
        ? "border-emerald-300 bg-gradient-to-b from-emerald-50/50 to-white shadow-md ring-1 ring-emerald-100"
        : "border-slate-200/60 bg-white hover:border-slate-300 hover:shadow-sm"
    }`}>
      {answer.isAccepted && (
        <div className="absolute top-0 right-0 h-32 w-32 -translate-y-16 translate-x-16 rounded-full bg-emerald-100/30 blur-2xl pointer-events-none" />
      )}
      {answer.isAccepted && (
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-100/50 w-fit px-3 py-1.5 rounded-full border border-emerald-200/50 shadow-sm relative">
          <Trophy className="h-4 w-4" /> Best Answer
        </div>
      )}

      <div className="flex items-start gap-4 relative">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#043658] to-[#0a5c91] text-sm font-bold text-white shadow-inner">
          {answer.teacher.firstName[0]}{answer.teacher.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className="text-sm font-bold text-slate-800">
              {answer.teacher.firstName} {answer.teacher.lastName}
            </span>
            <span className="text-[10px] font-bold rounded-full bg-[#043658]/10 px-2 py-0.5 text-[#043658]">
              {levelLabel(answer.teacher.level)}
            </span>
            {isMine && <span className="text-[10px] font-bold text-amber-700 rounded-full bg-amber-100 px-2 py-0.5 border border-amber-200 shadow-sm">Your answer</span>}
            <span className="text-xs font-medium text-slate-400 ml-auto flex items-center gap-1 before:content-['•'] before:text-slate-300 before:mr-1">
              {formatDate(answer.createdAt)}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{answer.content}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {/* Helpful */}
            {questionStatus !== "OPEN" && (
              <button
                onClick={() => onHelpful(answer.id)}
                disabled={isPendingHelpful || !!isMine}
                title={isMine ? "You cannot mark your own answer helpful" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all disabled:opacity-50 ${
                  answer.markedHelpful
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300 hover:shadow-sm"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${answer.markedHelpful ? "fill-blue-700" : ""}`} />
                Helpful {answer.helpfulCount > 0 && <span className="ml-0.5 rounded-md bg-white/50 px-1 py-0.5">{answer.helpfulCount}</span>}
              </button>
            )}

            {/* Select best answer */}
            {canSelectBest && (
              <button
                onClick={() => onBestAnswer(answer.id)}
                disabled={isPendingBestAnswer}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all disabled:opacity-50"
              >
                <Trophy className="h-3.5 w-3.5" />
                {isPendingBestAnswer ? "Selecting…" : "Mark Best Answer"}
              </button>
            )}

            {/* Unmark best answer */}
            {canUnmarkBest && (
              <button
                onClick={() => onUnmarkBestAnswer(answer.id)}
                disabled={isPendingBestAnswer}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 hover:shadow-sm transition-all disabled:opacity-50"
                title="Remove this as the best answer"
              >
                <Trophy className="h-3.5 w-3.5" />
                {isPendingBestAnswer ? "Unmarking…" : "Unmark Best Answer"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

interface Props { params: Promise<{ id: string }> }

export default function QuestionDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { status: verificationStatus } = useVerification();
  const isVerified = verificationStatus?.verificationStatus === "APPROVED";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const questionQuery = useQuestion(id);
  const answersQuery  = useAnswers(id);
  const submitMutation     = useSubmitAnswer(id);
  const helpfulMutation    = useToggleHelpful(id);
  const bestAnswerMutation = useSelectBestAnswer(id);

  const q = questionQuery.data;
  const ansData = answersQuery.data;

  // Auto-refetch answers when question transitions from OPEN to CLOSED
  const prevStatus = useRef(q?.effectiveStatus);
  useEffect(() => {
    if (prevStatus.current === "OPEN" && q?.effectiveStatus !== "OPEN") {
      answersQuery.refetch();
    }
    prevStatus.current = q?.effectiveStatus;
  }, [q?.effectiveStatus]);

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!answerText.trim()) { toast.error("Answer cannot be empty"); return; }
    if (!isVerified) {
      window.dispatchEvent(new CustomEvent("show-verification-modal"));
      return;
    }
    try {
      await submitMutation.mutateAsync(answerText.trim());
      setAnswerText("");
      toast.success("Answer submitted! It will be revealed when the question closes.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to submit answer");
    }
  }

  async function handleHelpful(answerId: string) {
    if (!isVerified) { window.dispatchEvent(new CustomEvent("show-verification-modal")); return; }
    try {
      await helpfulMutation.mutateAsync(answerId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to update helpful");
    }
  }

  async function handleBestAnswer(answerId: string) {
    try {
      await bestAnswerMutation.mutateAsync(answerId);
      toast.success("Best answer selected! Question is now solved.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to select best answer");
    }
  }

  async function handleUnmarkBestAnswer(answerId: string) {
    if (!confirm("Are you sure you want to unmark this as the best answer? The question will return to CLOSED status.")) {
      return;
    }
    try {
      await bestAnswerMutation.mutateAsync(answerId);
      toast.success("Best answer unmarked. You can now select a different answer.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Failed to unmark best answer");
    }
  }

  if (questionQuery.isLoading) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#043658]" />
        </main>
      </div>
    );
  }

  if (questionQuery.isError || !q) {
    return (
      <div className="h-screen overflow-hidden bg-[#F5F8FB]">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto flex flex-col items-center justify-center gap-4">
          <AlertCircle className="h-12 w-12 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Question not found</p>
          <Link href="/community/questions" className="rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:bg-[#032742]">
            Back to Questions
          </Link>
        </main>
      </div>
    );
  }

  const isAsker = q.isAsker ?? q.teacher.id === user?.id;
  const canAnswer = !isAsker && q.effectiveStatus === "OPEN" && !ansData?.answers?.find((a) => a.teacher.id === user?.id);
  const hasSubmittedAnswer = !isAsker && !!ansData?.answers?.find((a) => a.teacher.id === user?.id);

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FB]">
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      <main className="mt-16 lg:ml-64 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-5">

          {/* Back */}
          <button
            onClick={() => router.push("/community")}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#043658] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Network Community
          </button>

          {/* Status bar */}
          <QuestionStatusBar
            status={q.effectiveStatus}
            deadline={q.deadline}
            answerCount={q.answerCount}
            isAsker={isAsker}
          />

          {/* Question card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Meta */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#043658]/10 text-xs font-bold text-[#043658]">
                  {q.teacher.firstName[0]}{q.teacher.lastName[0]}
                </div>
                <span className="font-semibold text-slate-700">{q.teacher.firstName} {q.teacher.lastName}</span>
                <span className="rounded-full bg-[#043658]/8 px-2 py-0.5 font-semibold text-[#043658]">
                  {levelLabel(q.teacher.level)}
                </span>
              </div>
              <span>·</span>
              <span>{formatDate(q.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {q.views} views</span>
              {q.category && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 font-semibold text-blue-700">
                    <Tag className="h-3 w-3" /> {q.category.name}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-['Lexend'] text-xl font-bold text-[#043658] mb-3">{q.title}</h1>
            <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{q.description}</p>

            {/* Attachments */}
            {q.attachments && q.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {q.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "")}/${att.url}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-[#043658] hover:bg-slate-100 transition-colors"
                  >
                    📎 {att.fileName}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* ── Answers section ─────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#043658]">
                <MessageCircle className="h-5 w-5" />
                Answers
                {ansData && <span className="text-sm font-normal text-slate-400">({ansData.totalCount})</span>}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* BLIND PERIOD — for non-askers */}
              {ansData?.isBlind && !isAsker && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
                  <Lock className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-amber-800">🔒 Answers are hidden</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {ansData.totalCount > 0
                      ? `${ansData.totalCount} teacher${ansData.totalCount > 1 ? "s have" : " has"} submitted an answer.`
                      : "No answers submitted yet."}
                    {" "}Answers will be revealed when the question closes.
                  </p>
                  {!hasSubmittedAnswer && canAnswer && (
                    <p className="text-xs text-amber-700 mt-2 font-semibold">
                      Submit your own answer before the deadline to participate.
                    </p>
                  )}
                </div>
              )}

              {/* Answers list */}
              {answersQuery.isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[#043658]" />
                </div>
              ) : ansData?.answers && ansData.answers.length > 0 ? (
                <div className="space-y-4">
                  {ansData.answers.map((answer) => (
                    <AnswerCard
                      key={answer.id}
                      answer={answer}
                      isAsker={isAsker}
                      questionStatus={q.effectiveStatus}
                      onHelpful={handleHelpful}
                      onBestAnswer={handleBestAnswer}
                      onUnmarkBestAnswer={handleUnmarkBestAnswer}
                      isPendingHelpful={helpfulMutation.isPending}
                      isPendingBestAnswer={bestAnswerMutation.isPending}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              ) : !ansData?.isBlind ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
                  <HelpCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No answers yet</p>
                  <p className="text-xs text-slate-400 mt-1">Be the first to answer this question.</p>
                </div>
              ) : null}
            </div>
          </div>

          {/* ── Submit answer form ───────────────────────────────────── */}
          {!isAsker && q.effectiveStatus === "OPEN" && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-1 text-base font-bold text-[#043658]">
                {hasSubmittedAnswer ? "Your Answer" : "Submit Your Answer"}
              </h3>
              <p className="mb-4 text-xs text-slate-500">
                {hasSubmittedAnswer
                  ? "You have already submitted an answer."
                  : "Your answer will be hidden until the question closes — other teachers cannot see it during the deadline period."}
              </p>

              {!hasSubmittedAnswer && (
                <form onSubmit={handleSubmitAnswer} className="space-y-3">
                  <textarea
                    ref={answerRef}
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    rows={6}
                    placeholder="Write a clear, helpful answer…"
                    className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-[#043658] focus:outline-none focus:ring-1 focus:ring-[#043658]/20"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400">Your answer is private until the deadline.</p>
                    <button
                      type="submit"
                      disabled={submitMutation.isPending || !answerText.trim()}
                      className="flex items-center gap-2 rounded-lg bg-[#043658] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#032742] disabled:opacity-60"
                    >
                      {submitMutation.isPending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</>
                        : <><Send className="h-4 w-4" /> Submit Answer</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Asker — select best answer prompt */}
          {isAsker && q.effectiveStatus === "CLOSED" && !ansData?.answers?.find((a) => a.isAccepted) && (ansData?.answers?.length ?? 0) > 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              <p className="font-bold">Your question has closed! 🎉</p>
              <p className="text-xs mt-1">Review the answers above and select the best one to mark this question as solved.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
