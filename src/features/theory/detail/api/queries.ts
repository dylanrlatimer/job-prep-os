import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { theoryKeys } from '@/features/theory/api/query-keys';
import type { QuestionDetailResponse } from './contracts';

export const questionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: theoryKeys.questionDetail(id),
    queryFn: () => apiRequest<QuestionDetailResponse>(`/api/theory/questions/${id}/detail`),
    enabled: !!id,
  });
