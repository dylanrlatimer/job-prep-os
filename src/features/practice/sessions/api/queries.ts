import { queryOptions } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api-client';
import { practiceKeys } from '@/features/practice/api/query-keys';
import type {
  GetSessionResponse,
  GetSessionSetupResponse,
  ListActiveSessionsResponse,
  ListCompletedSessionsResponse,
  SessionHistoryDetailResponse,
  SessionItemReviewResponse,
} from './contracts';

export const sessionSetupQueryOptions = queryOptions({
  queryKey: practiceKeys.setup(),
  queryFn: () => apiRequest<GetSessionSetupResponse>('/api/practice/sessions/setup'),
});

export const activeSessionsQueryOptions = queryOptions({
  queryKey: practiceKeys.sessions(),
  queryFn: () => apiRequest<ListActiveSessionsResponse>('/api/practice/sessions'),
});

export const sessionQueryOptions = (id: string) =>
  queryOptions({
    queryKey: practiceKeys.session(id),
    queryFn: () => apiRequest<GetSessionResponse>(`/api/practice/sessions/${id}`),
    enabled: !!id,
    staleTime: 0,
  });

export const sessionNextQueryOptions = (id: string) =>
  queryOptions({
    queryKey: [...practiceKeys.session(id), 'next'] as const,
    queryFn: () => apiRequest<GetSessionResponse>(`/api/practice/sessions/${id}`),
    enabled: false,
    staleTime: 0,
  });

export const sessionItemReviewQueryOptions = (sessionId: string, itemId: string) =>
  queryOptions({
    queryKey: [...practiceKeys.session(sessionId), 'review', itemId] as const,
    queryFn: () => apiRequest<SessionItemReviewResponse>(`/api/practice/sessions/${sessionId}/items/${itemId}/review`),
    enabled: false,
    staleTime: Infinity,
  });

export const completedSessionsQueryOptions = queryOptions({
  queryKey: practiceKeys.history(),
  queryFn: () => apiRequest<ListCompletedSessionsResponse>('/api/practice/history'),
});

export const sessionHistoryDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: practiceKeys.historyDetail(id),
    queryFn: () => apiRequest<SessionHistoryDetailResponse>(`/api/practice/history/${id}`),
    enabled: !!id,
  });
