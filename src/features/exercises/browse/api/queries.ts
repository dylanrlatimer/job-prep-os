import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { BrowseExerciseDetailResponse, BrowseExerciseListQuery, GetBrowseExercisesResponse } from './contracts';

export const browseExercisesQueryOptions = (query: BrowseExerciseListQuery) =>
  queryOptions({
    queryKey: exerciseKeys.browseList(query),
    queryFn: () => apiRequest<GetBrowseExercisesResponse>(`/api/exercises/browse?${toListSearchParams(query)}`),
    placeholderData: keepPreviousData,
  });

export const browseExerciseDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: exerciseKeys.browseExercise(id),
    queryFn: () => apiRequest<BrowseExerciseDetailResponse>(`/api/exercises/browse/${id}`),
    enabled: !!id,
  });
