import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { theoryKeys } from '@/features/theory/api/query-keys';
import type { PracticeQuestionResponse } from './contracts';

export const practiceQuestionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: theoryKeys.practice(id),
    queryFn: () => apiRequest<PracticeQuestionResponse>(`/api/theory/questions/${id}/practice`),
    enabled: !!id,
  });
