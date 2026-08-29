import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { BuilderMetadataResponse, ExerciseResponse } from './contracts';

export const builderMetadataQueryOptions = queryOptions({
  queryKey: exerciseKeys.builderMetadata(),
  queryFn: () => apiRequest<BuilderMetadataResponse>('/api/exercises/builder-metadata'),
});

export const exerciseDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: exerciseKeys.exercise(id),
    queryFn: () => apiRequest<ExerciseResponse>(`/api/exercises/${id}`),
    enabled: !!id,
  });
