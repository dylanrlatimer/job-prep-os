import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { BrowseExerciseDetailResponse, GetBrowseExercisesResponse } from './contracts';

export const browseExercisesQueryOptions = queryOptions({
  queryKey: exerciseKeys.browse(),
  queryFn: () => apiRequest<GetBrowseExercisesResponse>('/api/exercises/browse'),
});

export const browseExerciseDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: exerciseKeys.browseExercise(id),
    queryFn: () => apiRequest<BrowseExerciseDetailResponse>(`/api/exercises/browse/${id}`),
    enabled: !!id,
  });
