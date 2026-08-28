export const theoryKeys = {
  all: () => ['theory'] as const,
  repository: () => [...theoryKeys.all(), 'repository'] as const,
  builderMetadata: () => [...theoryKeys.all(), 'builder-metadata'] as const,
  questions: () => [...theoryKeys.all(), 'questions'] as const,
  question: (id: string) => [...theoryKeys.questions(), id] as const,
};
