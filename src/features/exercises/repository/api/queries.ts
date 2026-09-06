import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { ExerciseRepositoryListQuery, GetExerciseRepositoryResponse } from './contracts';

export const exerciseRepositoryQueryOptions = (query: ExerciseRepositoryListQuery) =>
  queryOptions({
    queryKey: exerciseKeys.repositoryList(query),
    queryFn: () => apiRequest<GetExerciseRepositoryResponse>(`/api/exercises/repository?${toListSearchParams(query)}`),
    placeholderData: keepPreviousData,
  });
