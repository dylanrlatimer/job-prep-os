import { apiPost } from '@/lib/api-client';
import type { SaveBrowseQuestionResponse } from './contracts';

export async function saveBrowseQuestion(questionId: string): Promise<SaveBrowseQuestionResponse> {
  return apiPost<SaveBrowseQuestionResponse>(`/api/theory/browse/${questionId}/save`, {});
}
