import { keepPreviousData, queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { toListSearchParams } from '@/common/lib/pagination';
import { theoryKeys } from '@/features/theory/api/query-keys';
import { exerciseKeys } from '@/features/exercises/api/query-keys';
import type { BrowseKind } from '@/features/theory/browse/lib/browse-filters';
import type { BrowseQuestionDetailResponse, BrowseListQuery, GetBrowseAllResponse, GetBrowseResponse } from './contracts';
import type { GetBrowseExercisesResponse } from '@/features/exercises/browse/api/contracts';

function toBrowsePageResponse(kind: BrowseKind, query: BrowseListQuery): Promise<GetBrowseAllResponse> {
  if (kind === 'questions') {
    return apiRequest<GetBrowseResponse>(`/api/theory/browse?${toListSearchParams(query)}`).then((data) => ({
      items: data.questions.map((item) => ({ type: 'question' as const, item })),
      topics: data.topics,
      page: data.page,
      pageSize: data.pageSize,
      totalCount: data.totalCount,
      unfilteredCount: data.unfilteredCount,
    }));
  }

  if (kind === 'exercises') {
    return apiRequest<GetBrowseExercisesResponse>(`/api/exercises/browse?${toListSearchParams(query)}`).then((data) => ({
      items: data.exercises.map((item) => ({ type: 'exercise' as const, item })),
      topics: data.topics,
      page: data.page,
      pageSize: data.pageSize,
      totalCount: data.totalCount,
      unfilteredCount: data.unfilteredCount,
    }));
  }

  return apiRequest<GetBrowseAllResponse>(`/api/browse?${toListSearchParams(query)}`);
}

export const browsePageQueryOptions = (kind: BrowseKind, query: BrowseListQuery) =>
  queryOptions({
    queryKey:
      kind === 'all'
        ? theoryKeys.browseAllList(query)
        : kind === 'questions'
          ? ([...theoryKeys.browse(), 'page', query] as const)
          : ([...exerciseKeys.browse(), 'page', query] as const),
    queryFn: () => toBrowsePageResponse(kind, query),
    placeholderData: keepPreviousData,
  });

export const browseQuestionDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: theoryKeys.browseQuestion(id),
    queryFn: () => apiRequest<BrowseQuestionDetailResponse>(`/api/theory/browse/${id}`),
    enabled: !!id,
  });
