import { apiPost } from '@/lib/api-client';
import type {
  AnswerExerciseItemInput,
  AnswerExerciseItemResponse,
  AnswerTheoryItemInput,
  AnswerTheoryItemResponse,
  CreateSessionInput,
  CreateSessionResponse,
  SkipItemResponse,
} from './contracts';

export function createSession(input: CreateSessionInput): Promise<CreateSessionResponse> {
  return apiPost<CreateSessionResponse>('/api/practice/sessions', input);
}

export function answerSessionItemTheory(sessionId: string, itemId: string, input: AnswerTheoryItemInput): Promise<AnswerTheoryItemResponse> {
  return apiPost<AnswerTheoryItemResponse>(`/api/practice/sessions/${sessionId}/items/${itemId}/answer`, input);
}

export function answerSessionItemExercise(sessionId: string, itemId: string, input: AnswerExerciseItemInput): Promise<AnswerExerciseItemResponse> {
  return apiPost<AnswerExerciseItemResponse>(`/api/practice/sessions/${sessionId}/items/${itemId}/answer`, input);
}

export function skipSessionItem(sessionId: string, itemId: string): Promise<SkipItemResponse> {
  return apiPost<SkipItemResponse>(`/api/practice/sessions/${sessionId}/items/${itemId}/skip`, {});
}
