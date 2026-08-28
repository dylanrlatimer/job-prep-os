import { apiPost, apiRequest } from '@/lib/api-client';
import type { CreateAttemptInput, CreateAttemptResponse, PracticeReviewResponse } from './contracts';

export async function fetchPracticeReview(questionId: string): Promise<PracticeReviewResponse> {
  return apiRequest<PracticeReviewResponse>(`/api/theory/questions/${questionId}/practice/review`);
}

export async function createAttempt(questionId: string, payload: CreateAttemptInput): Promise<CreateAttemptResponse> {
  return apiPost<CreateAttemptResponse>(`/api/theory/questions/${questionId}/practice/attempts`, payload);
}
