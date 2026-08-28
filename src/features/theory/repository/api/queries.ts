import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { theoryKeys } from '@/features/theory/api/query-keys';
import type { GetRepositoryResponse } from './contracts';

export const repositoryQueryOptions = queryOptions({
  queryKey: theoryKeys.repository(),
  queryFn: () => apiRequest<GetRepositoryResponse>('/api/theory/repository'),
});
