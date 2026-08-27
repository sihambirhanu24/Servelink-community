"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  getQuestions,
  getQuestion,
  getAnswers,
  createQuestion,
  submitAnswer,
  deleteAnswer,
  toggleHelpful,
  selectBestAnswer,
  type QuestionFilter,
  type QuestionSortKey,
  type QuestionListResponse,
  type AnswersResponse,
} from "@/services/questions";
import type { CommunityTypeKey } from "@/services/community";

// ─── Query keys ──────────────────────────────────────────────────────────────

export const QA_KEYS = {
  list:    (params?: object)   => ["questions", "list",    params ?? {}] as const,
  detail:  (id: string)        => ["questions", "detail",  id]            as const,
  answers: (id: string)        => ["questions", "answers", id]            as const,
};

// ─── Questions list ──────────────────────────────────────────────────────────

export function useQuestions(params?: {
  status?: QuestionFilter;
  sort?: QuestionSortKey;
  search?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
  communityType?: CommunityTypeKey;
}) {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: QA_KEYS.list(params),
    queryFn:  () => getQuestions(params),
    enabled:  !isInitializing && !!token,
    staleTime: 30_000,
  });
}

// ─── Question detail ─────────────────────────────────────────────────────────

export function useQuestion(id: string | null) {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: QA_KEYS.detail(id ?? ""),
    queryFn:  () => getQuestion(id!),
    enabled:  !isInitializing && !!token && !!id,
    staleTime: 15_000,
    // Refetch more frequently when question is close to its deadline
    refetchInterval: (query) => {
      const q = query.state.data as any;
      if (!q || q.effectiveStatus !== "OPEN" || !q.deadline) return false;
      const msLeft = new Date(q.deadline).getTime() - Date.now();
      if (msLeft <= 0) return 5_000;     // just expired — poll fast
      if (msLeft <= 60_000) return 5_000; // < 1 min left — poll every 5s
      if (msLeft <= 600_000) return 30_000; // < 10 min left — every 30s
      return false;
    },
  });
}

// ─── Answers ─────────────────────────────────────────────────────────────────

export function useAnswers(questionId: string | null) {
  const { token, isInitializing } = useAuth();

  return useQuery({
    queryKey: QA_KEYS.answers(questionId ?? ""),
    queryFn:  () => getAnswers(questionId!),
    enabled:  !isInitializing && !!token && !!questionId,
    staleTime: 15_000,
    // Poll to auto-reveal answers when deadline passes
    refetchInterval: (query) => {
      const d = query.state.data as AnswersResponse | undefined;
      if (!d?.isBlind) return false; // already revealed
      // Fetch answers from question detail to check deadline
      return 15_000;
    },
  });
}

// ─── Create question ─────────────────────────────────────────────────────────

export function useCreateQuestion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      // Invalidate the whole questions list and overview stats
      qc.invalidateQueries({ queryKey: ["questions"] });
      qc.invalidateQueries({ queryKey: ["community-feed"] });
      qc.invalidateQueries({ queryKey: ["network-overview"] });
      // Invalidate progress queries to update points
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["activityHistory"] });
    },
  });
}

// ─── Submit answer ────────────────────────────────────────────────────────────

export function useSubmitAnswer(questionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => submitAnswer(questionId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QA_KEYS.answers(questionId) });
      qc.invalidateQueries({ queryKey: QA_KEYS.detail(questionId) });
      qc.invalidateQueries({ queryKey: ["questions", "list"] });
    },
  });
}

// ─── Delete answer ────────────────────────────────────────────────────────────

export function useDeleteAnswer(questionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (answerId: string) => deleteAnswer(questionId, answerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QA_KEYS.answers(questionId) });
      qc.invalidateQueries({ queryKey: QA_KEYS.detail(questionId) });
    },
  });
}

// ─── Helpful toggle (optimistic) ──────────────────────────────────────────────

export function useToggleHelpful(questionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (answerId: string) => toggleHelpful(answerId),
    onMutate: async (answerId) => {
      await qc.cancelQueries({ queryKey: QA_KEYS.answers(questionId) });
      const snapshot = qc.getQueryData<AnswersResponse>(QA_KEYS.answers(questionId));

      qc.setQueryData<AnswersResponse>(QA_KEYS.answers(questionId), (old) => {
        if (!old) return old;
        return {
          ...old,
          answers: old.answers.map((a) =>
            a.id === answerId
              ? {
                  ...a,
                  markedHelpful: !a.markedHelpful,
                  helpfulCount: a.markedHelpful ? a.helpfulCount - 1 : a.helpfulCount + 1,
                }
              : a,
          ),
        };
      });

      return { snapshot };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.snapshot) {
        qc.setQueryData(QA_KEYS.answers(questionId), ctx.snapshot);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QA_KEYS.answers(questionId) });
    },
  });
}

// ─── Select best answer ───────────────────────────────────────────────────────

export function useSelectBestAnswer(questionId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (answerId: string) => selectBestAnswer(questionId, answerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QA_KEYS.detail(questionId) });
      qc.invalidateQueries({ queryKey: QA_KEYS.answers(questionId) });
      qc.invalidateQueries({ queryKey: ["questions", "list"] });
      // Invalidate progress queries for best answer points
      qc.invalidateQueries({ queryKey: ["progress"] });
      qc.invalidateQueries({ queryKey: ["activityHistory"] });
    },
  });
}
