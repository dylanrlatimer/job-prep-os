import SystemQuestionViewPage from '@/features/admin/questions/components/SystemQuestionViewPage';

type ViewSystemQuestionPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function ViewSystemQuestionPage({ params }: ViewSystemQuestionPageProps) {
  const { questionId } = await params;
  return <SystemQuestionViewPage questionId={questionId} />;
}
