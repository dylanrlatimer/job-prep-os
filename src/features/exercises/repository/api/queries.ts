import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { GetExerciseRepositoryResponse } from './contracts';

export const exerciseRepositoryQueryOptions = queryOptions({
  queryKey: exerciseKeys.repository(),
  queryFn: () => apiRequest<GetExerciseRepositoryResponse>('/api/exercises/repository'),
});
