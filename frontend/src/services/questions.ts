import api from "@/lib/axios";
import type { CommunityTypeKey } from "@/services/community";

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionStatus = "OPEN" | "CLOSED" | "SOLVED";

export interface QuestionTeacher {
  id: string;
  firstName: string;
  lastName: string;
  profileImage?: string | null;
  level: string;
  verified?: boolean;
}

export interface QuestionTag {
  tag: { id: string; name: string };
}

export interface QuestionAttachment {
  id: string;
  url: string;
  type: "IMAGE" | "PDF" | "DOCX" | "VIDEO";
  fileName: string;
  fileSize: number;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  postType: "QUESTION";
  questionStatus: QuestionStatus;
  effectiveStatus: QuestionStatus;
  deadline?: string | null;
  bestAnswerId?: string | null;
  solvedAt?: string | null;
  isResolved: boolean;
  views: number;
  createdAt: string;
  updatedAt: string;
  teacher: QuestionTeacher;
  category?: { id: string; name: string } | null;
  community?: { id: string; name: string; type: string } | null;
  tags?: QuestionTag[];
  attachments?: QuestionAttachment[];
  answerCount: number;
  isAsker?: boolean;
  isOpen?: boolean;
}

export interface Answer {
  id: string;
  content: string;
  postId: string;
  parentId?: string | null;
  isAccepted: boolean;
  helpfulCount: number;
  markedHelpful: boolean;
  createdAt: string;
  updatedAt: string;
  teacher: QuestionTeacher;
}

export interface AnswersResponse {
  answers: Answer[];
  isBlind: boolean;
  totalCount: number;
  canAnswer: boolean;
}

export interface QuestionListResponse {
  data: Question[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type QuestionSortKey = "newest" | "most-answers" | "most-helpful" | "ending-soon";
export type QuestionFilter = "all" | "OPEN" | "CLOSED" | "SOLVED";

// ─── API calls ────────────────────────────────────────────────────────────────

export async function getQuestions(params?: {
  status?: QuestionFilter;
  sort?: QuestionSortKey;
  search?: string;
  mine?: boolean;
  page?: number;
  limit?: number;
  communityType?: CommunityTypeKey;
}): Promise<QuestionListResponse> {
  const { data } = await api.get<QuestionListResponse>("/community/questions", {
    params: {
      ...params,
      mine: params?.mine ? "true" : undefined,
    },
  });
  return data;
}

export async function getQuestion(id: string): Promise<Question> {
  const { data } = await api.get<Question>(`/community/questions/${id}`);
  return data;
}

export async function getAnswers(questionId: string): Promise<AnswersResponse> {
  const { data } = await api.get<AnswersResponse>(`/community/questions/${questionId}/answers`);
  return data;
}

export async function createQuestion(payload: {
  communityType: CommunityTypeKey;
  title: string;
  description: string;
  categoryId: string;
  deadline: string; // ISO 8601 DateTime string
}): Promise<Question> {
  const { data } = await api.post<Question>("/community/questions", payload);
  return data;
}

export async function submitAnswer(questionId: string, content: string): Promise<Answer> {
  const { data } = await api.post<Answer>(`/community/questions/${questionId}/answers`, { content });
  return data;
}

export async function deleteAnswer(questionId: string, answerId: string) {
  const { data } = await api.delete(`/community/questions/${questionId}/answers/${answerId}`);
  return data;
}

export async function toggleHelpful(answerId: string): Promise<{ marked: boolean }> {
  const { data } = await api.post<{ marked: boolean }>(`/community/questions/answers/${answerId}/helpful`);
  return data;
}

export async function selectBestAnswer(questionId: string, answerId: string) {
  const { data } = await api.post(`/community/questions/${questionId}/best-answer/${answerId}`);
  return data;
}
