import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { ExerciseDetailResponse } from './contracts';

export const exerciseDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: exerciseKeys.exerciseDetail(id),
    queryFn: () => apiRequest<ExerciseDetailResponse>(`/api/exercises/${id}/detail`),
    enabled: !!id,
  });
