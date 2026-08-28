export const theoryKeys = {
  all: () => ['theory'] as const,
  repository: () => [...theoryKeys.all(), 'repository'] as const,
};
