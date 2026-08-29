export const exerciseKeys = {
  all: () => ['exercises'] as const,
  repository: () => [...exerciseKeys.all(), 'repository'] as const,
  builderMetadata: () => [...exerciseKeys.all(), 'builder-metadata'] as const,
  exercises: () => [...exerciseKeys.all(), 'exercises'] as const,
  exercise: (id: string) => [...exerciseKeys.exercises(), id] as const,
  exerciseDetail: (id: string) => [...exerciseKeys.all(), 'exercise-detail', id] as const,
  practice: (id: string) => [...exerciseKeys.all(), 'practice', id] as const,
  browse: () => [...exerciseKeys.all(), 'browse'] as const,
  browseExercise: (id: string) => [...exerciseKeys.browse(), 'exercise', id] as const,
};
