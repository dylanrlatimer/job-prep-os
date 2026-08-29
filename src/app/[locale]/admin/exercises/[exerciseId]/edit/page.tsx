import SystemExerciseBuilderPage from '@/features/admin/exercises/components/SystemExerciseBuilderPage';

type EditSystemExercisePageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function EditSystemExercisePage({ params }: EditSystemExercisePageProps) {
  const { exerciseId } = await params;
  return <SystemExerciseBuilderPage exerciseId={exerciseId} />;
}
