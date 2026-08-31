import type { QueryClient } from '@tanstack/react-query';
import { practiceKeys } from './query-keys';

export async function invalidatePracticeSessions(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: practiceKeys.sessions(), refetchType: 'all' });
}

export async function invalidatePracticeSession(queryClient: QueryClient, sessionId: string) {
  await queryClient.invalidateQueries({ queryKey: practiceKeys.session(sessionId), refetchType: 'all' });
}

export async function invalidatePracticeHistory(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: practiceKeys.history(), refetchType: 'all' });
}
