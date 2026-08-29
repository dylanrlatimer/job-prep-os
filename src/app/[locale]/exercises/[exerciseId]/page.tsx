import ExerciseDetailPage from '@/features/exercises/detail/components/ExerciseDetailPage';

type ExercisePageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function ExercisePage({ params }: ExercisePageProps) {
  const { exerciseId } = await params;
  return <ExerciseDetailPage exerciseId={exerciseId} />;
}
