import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { ExercisePracticeResponse } from './contracts';

export const exercisePracticeQueryOptions = (id: string) =>
  queryOptions({
    queryKey: exerciseKeys.practice(id),
    queryFn: () => apiRequest<ExercisePracticeResponse>(`/api/exercises/${id}/practice`),
    enabled: !!id,
  });
