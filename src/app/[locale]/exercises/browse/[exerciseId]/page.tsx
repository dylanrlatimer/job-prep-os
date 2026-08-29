import BrowseExerciseDetailPage from '@/features/exercises/browse/components/BrowseExerciseDetailPage';

type BrowseExercisePageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function BrowseExercisePage({ params }: BrowseExercisePageProps) {
  const { exerciseId } = await params;
  return <BrowseExerciseDetailPage exerciseId={exerciseId} />;
}
