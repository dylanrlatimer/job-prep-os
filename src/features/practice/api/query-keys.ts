import type { CreateSessionInput } from '@/features/practice/sessions/api/contracts';

export const practiceKeys = {
  all: () => ['practice'] as const,
  setup: () => [...practiceKeys.all(), 'setup'] as const,
  preview: (input: CreateSessionInput) => [...practiceKeys.all(), 'preview', input] as const,
  sessions: () => [...practiceKeys.all(), 'sessions'] as const,
  session: (id: string) => [...practiceKeys.sessions(), id] as const,
  history: () => [...practiceKeys.all(), 'history'] as const,
  historyDetail: (id: string) => [...practiceKeys.history(), id] as const,
};
