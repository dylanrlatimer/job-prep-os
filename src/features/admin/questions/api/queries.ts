import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { ListSystemQuestionsResponse, SystemQuestionResponse } from './contracts';

export const systemQuestionsQueryOptions = queryOptions({
  queryKey: adminKeys.systemQuestions(),
  queryFn: () => apiRequest<ListSystemQuestionsResponse>('/api/admin/questions'),
});

export const systemQuestionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.systemQuestion(id),
    queryFn: () => apiRequest<SystemQuestionResponse>(`/api/admin/questions/${id}`),
    enabled: !!id,
  });
