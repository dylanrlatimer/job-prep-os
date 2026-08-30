export const adminKeys = {
  all: () => ['admin'] as const,
  systemQuestions: () => [...adminKeys.all(), 'system-questions'] as const,
  systemQuestion: (id: string) => [...adminKeys.systemQuestions(), id] as const,
  systemExercises: () => [...adminKeys.all(), 'system-exercises'] as const,
  systemExercise: (id: string) => [...adminKeys.systemExercises(), id] as const,
  topics: () => [...adminKeys.all(), 'topics'] as const,
  topic: (id: string) => [...adminKeys.topics(), id] as const,
};
