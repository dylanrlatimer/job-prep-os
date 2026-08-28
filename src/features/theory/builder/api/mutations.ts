import { apiPatch, apiPost } from '@/lib/api-client';
import type { CreateQuestionInput, CreateQuestionResponse, UpdateQuestionInput, UpdateQuestionResponse } from './contracts';

export async function createQuestion(payload: CreateQuestionInput): Promise<CreateQuestionResponse> {
  return apiPost<CreateQuestionResponse>('/api/theory/questions', payload);
}

export async function updateQuestion(id: string, payload: UpdateQuestionInput): Promise<UpdateQuestionResponse> {
  return apiPatch<UpdateQuestionResponse>(`/api/theory/questions/${id}`, payload);
}
