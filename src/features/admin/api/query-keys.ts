export const adminKeys = {
  all: () => ['admin'] as const,
  systemQuestions: () => [...adminKeys.all(), 'system-questions'] as const,
  systemQuestion: (id: string) => [...adminKeys.systemQuestions(), id] as const,
  systemExercises: () => [...adminKeys.all(), 'system-exercises'] as const,
  systemExercise: (id: string) => [...adminKeys.systemExercises(), id] as const,
  categories: () => [...adminKeys.all(), 'categories'] as const,
  category: (id: string) => [...adminKeys.categories(), id] as const,
};
