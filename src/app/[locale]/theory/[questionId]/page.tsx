import QuestionDetailPage from '@/features/theory/detail/components/QuestionDetailPage';

type QuestionPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function QuestionPage({ params }: QuestionPageProps) {
  const { questionId } = await params;
  return <QuestionDetailPage questionId={questionId} />;
}
