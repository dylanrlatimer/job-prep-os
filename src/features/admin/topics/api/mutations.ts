import { apiDelete, apiPatch, apiPost } from '@/lib/api-client';
import type { CreateTopicResponse, DeleteTopicResponse, TopicInput, UpdateTopicInput, UpdateTopicResponse } from './contracts';

export async function createTopic(payload: TopicInput): Promise<CreateTopicResponse> {
  return apiPost<CreateTopicResponse>('/api/admin/topics', payload);
}

export async function updateTopic(id: string, payload: UpdateTopicInput): Promise<UpdateTopicResponse> {
  return apiPatch<UpdateTopicResponse>(`/api/admin/topics/${id}`, payload);
}

export async function deleteTopic(id: string): Promise<DeleteTopicResponse> {
  return apiDelete<DeleteTopicResponse>(`/api/admin/topics/${id}`);
}
