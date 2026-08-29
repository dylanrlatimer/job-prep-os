import { apiDelete } from '@/lib/api-client';
import type { UnsaveRepositoryQuestionResponse } from './contracts';

export async function unsaveRepositoryQuestion(questionId: string): Promise<UnsaveRepositoryQuestionResponse> {
  return apiDelete<UnsaveRepositoryQuestionResponse>(`/api/theory/repository/${questionId}`);
}
