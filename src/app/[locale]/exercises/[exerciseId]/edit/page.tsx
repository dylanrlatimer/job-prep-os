import ExerciseBuilderPage from '@/features/exercises/builder/components/ExerciseBuilderPage';

type EditExercisePageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function EditExercisePage({ params }: EditExercisePageProps) {
  const { exerciseId } = await params;
  return <ExerciseBuilderPage exerciseId={exerciseId} />;
}
