import { apiPatch, apiPost } from '@/lib/api-client';
import type { CreateSystemQuestionInput, CreateSystemQuestionResponse, UpdateSystemQuestionInput, UpdateSystemQuestionResponse } from './contracts';

export async function createSystemQuestion(payload: CreateSystemQuestionInput): Promise<CreateSystemQuestionResponse> {
  return apiPost<CreateSystemQuestionResponse>('/api/admin/questions', payload);
}

export async function updateSystemQuestion(id: string, payload: UpdateSystemQuestionInput): Promise<UpdateSystemQuestionResponse> {
  return apiPatch<UpdateSystemQuestionResponse>(`/api/admin/questions/${id}`, payload);
}
