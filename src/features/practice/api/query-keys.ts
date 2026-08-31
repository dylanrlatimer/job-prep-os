export const practiceKeys = {
  all: () => ['practice'] as const,
  setup: () => [...practiceKeys.all(), 'setup'] as const,
  sessions: () => [...practiceKeys.all(), 'sessions'] as const,
  session: (id: string) => [...practiceKeys.sessions(), id] as const,
  history: () => [...practiceKeys.all(), 'history'] as const,
  historyDetail: (id: string) => [...practiceKeys.history(), id] as const,
};
