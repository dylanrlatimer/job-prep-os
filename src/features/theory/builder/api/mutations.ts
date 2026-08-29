import { apiPatch, apiPost, apiDelete } from '@/lib/api-client';
import type { CreateQuestionInput, CreateQuestionResponse, DeleteQuestionResponse, UpdateQuestionInput, UpdateQuestionResponse } from './contracts';

export async function createQuestion(payload: CreateQuestionInput): Promise<CreateQuestionResponse> {
  return apiPost<CreateQuestionResponse>('/api/theory/questions', payload);
}

export async function updateQuestion(id: string, payload: UpdateQuestionInput): Promise<UpdateQuestionResponse> {
  return apiPatch<UpdateQuestionResponse>(`/api/theory/questions/${id}`, payload);
}

export async function deleteQuestion(id: string): Promise<DeleteQuestionResponse> {
  return apiDelete<DeleteQuestionResponse>(`/api/theory/questions/${id}`);
}
