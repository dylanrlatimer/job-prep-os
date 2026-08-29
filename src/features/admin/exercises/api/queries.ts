import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { adminKeys } from '@/features/admin/api/query-keys';
import type { ListSystemExercisesResponse, SystemExerciseResponse } from './contracts';

export const systemExercisesQueryOptions = queryOptions({
  queryKey: adminKeys.systemExercises(),
  queryFn: () => apiRequest<ListSystemExercisesResponse>('/api/admin/exercises'),
});

export const systemExerciseQueryOptions = (id: string) =>
  queryOptions({
    queryKey: adminKeys.systemExercise(id),
    queryFn: () => apiRequest<SystemExerciseResponse>(`/api/admin/exercises/${id}`),
    enabled: !!id,
  });
