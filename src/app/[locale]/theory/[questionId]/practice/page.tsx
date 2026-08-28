import PracticePage from '@/features/theory/practice/components/PracticePage';

type PracticeRoutePageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function PracticeRoutePage({ params }: PracticeRoutePageProps) {
  const { questionId } = await params;
  return <PracticePage questionId={questionId} />;
}
