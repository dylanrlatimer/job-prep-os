import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { ListSystemQuestionsResponse, SystemQuestionListQuery, SystemQuestionResponse } from './contracts';

export const systemQuestionsQueryOptions = (query: SystemQuestionListQuery) =>
  queryOptions({
    queryKey: adminKeys.systemQuestionsList(query),
    queryFn: () => apiRequest<ListSystemQuestionsResponse>(`/api/admin/questions?${toListSearchParams(query)}`),
    placeholderData: keepPreviousData,
  });

export const systemQuestionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.systemQuestion(id),
    queryFn: () => apiRequest<SystemQuestionResponse>(`/api/admin/questions/${id}`),
    enabled: !!id,
  });
