import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { theoryKeys } from '@/features/theory/api/query-keys';
import type { BuilderMetadataResponse, QuestionResponse } from './contracts';

export const builderMetadataQueryOptions = queryOptions({
  queryKey: theoryKeys.builderMetadata(),
  queryFn: () => apiRequest<BuilderMetadataResponse>('/api/theory/builder-metadata'),
});

export const questionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: theoryKeys.question(id),
    queryFn: () => apiRequest<QuestionResponse>(`/api/theory/questions/${id}`),
    enabled: !!id,
  });
