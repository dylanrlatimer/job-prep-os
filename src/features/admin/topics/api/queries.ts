import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { ListAdminTopicsResponse, TopicResponse } from './contracts';

export const adminTopicsQueryOptions = queryOptions({
  queryKey: adminKeys.topics(),
  queryFn: () => apiRequest<ListAdminTopicsResponse>('/api/admin/topics'),
});

export const topicQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.topic(id),
    queryFn: () => apiRequest<TopicResponse>(`/api/admin/topics/${id}`),
    enabled: !!id,
  });
