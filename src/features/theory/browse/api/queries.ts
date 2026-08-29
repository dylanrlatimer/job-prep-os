import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { theoryKeys } from '@/features/theory/api/query-keys';
import type { BrowseQuestionDetailResponse, GetBrowseResponse } from './contracts';

export const browseQueryOptions = queryOptions({
  queryKey: theoryKeys.browse(),
  queryFn: () => apiRequest<GetBrowseResponse>('/api/theory/browse'),
});

export const browseQuestionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: theoryKeys.browseQuestion(id),
    queryFn: () => apiRequest<BrowseQuestionDetailResponse>(`/api/theory/browse/${id}`),
    enabled: !!id,
  });
