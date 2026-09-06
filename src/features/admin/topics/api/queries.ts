import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { AdminTopicListQuery, ListAdminTopicsResponse, TopicResponse } from './contracts';

export const adminTopicsQueryOptions = (query: AdminTopicListQuery) =>
  queryOptions({
    queryKey: adminKeys.topicsList(query),
    queryFn: () => apiRequest<ListAdminTopicsResponse>(`/api/admin/topics?${toListSearchParams(query)}`),
    placeholderData: keepPreviousData,
  });

export const topicQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.topic(id),
    queryFn: () => apiRequest<TopicResponse>(`/api/admin/topics/${id}`),
    enabled: !!id,
  });
