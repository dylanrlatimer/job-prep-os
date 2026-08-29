import ExercisePracticePage from '@/features/exercises/practice/components/ExercisePracticePage';

type ExercisePracticeRoutePageProps = {
  params: Promise<{ exerciseId: string }>;
};

export default async function ExercisePracticeRoutePage({ params }: ExercisePracticeRoutePageProps) {
  const { exerciseId } = await params;
  return <ExercisePracticePage exerciseId={exerciseId} />;
}
