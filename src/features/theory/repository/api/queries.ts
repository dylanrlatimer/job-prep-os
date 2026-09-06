import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { theoryKeys } from '@/features/theory/api/query-keys';
import type { GetRepositoryResponse, RepositoryListQuery } from './contracts';

export const repositoryQueryOptions = (query: RepositoryListQuery) =>
  queryOptions({
    queryKey: theoryKeys.repositoryList(query),
    queryFn: () => apiRequest<GetRepositoryResponse>(`/api/theory/repository?${toListSearchParams(query)}`),
    placeholderData: keepPreviousData,
  });
