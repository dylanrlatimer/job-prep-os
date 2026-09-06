export const adminKeys = {
  all: () => ['admin'] as const,
  systemQuestions: () => [...adminKeys.all(), 'system-questions'] as const,
  systemQuestionsList: (params: { page: number; search: string; topicId?: string; publication: string }) =>
    [...adminKeys.systemQuestions(), params] as const,
  systemQuestion: (id: string) => [...adminKeys.systemQuestions(), id] as const,
  systemExercises: () => [...adminKeys.all(), 'system-exercises'] as const,
  systemExercisesList: (params: { page: number; search: string; topicId?: string; publication: string }) =>
    [...adminKeys.systemExercises(), params] as const,
  systemExercise: (id: string) => [...adminKeys.systemExercises(), id] as const,
  topics: () => [...adminKeys.all(), 'topics'] as const,
  topicsList: (params: { page: number; search: string; status: string }) => [...adminKeys.topics(), params] as const,
  topic: (id: string) => [...adminKeys.topics(), id] as const,
};
