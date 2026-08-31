import SystemExerciseViewPage from '@/features/admin/exercises/components/SystemExerciseViewPage';

type ViewSystemExercisePageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function ViewSystemExercisePage({ params }: ViewSystemExercisePageProps) {
  const { exerciseId } = await params;
  return <SystemExerciseViewPage exerciseId={exerciseId} />;
}
