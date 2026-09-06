import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { ListSystemExercisesResponse, SystemExerciseListQuery, SystemExerciseResponse } from './contracts';

export const systemExercisesQueryOptions = (query: SystemExerciseListQuery) =>
  queryOptions({
    queryKey: adminKeys.systemExercisesList(query),
    queryFn: () => apiRequest<ListSystemExercisesResponse>(`/api/admin/exercises?${toListSearchParams(query)}`),
    placeholderData: keepPreviousData,
  });

export const systemExerciseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.systemExercise(id),
    queryFn: () => apiRequest<SystemExerciseResponse>(`/api/admin/exercises/${id}`),
    enabled: !!id,
  });
