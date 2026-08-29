import SystemQuestionBuilderPage from '@/features/admin/questions/components/SystemQuestionBuilderPage';

type EditSystemQuestionPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function EditSystemQuestionPage({ params }: EditSystemQuestionPageProps) {
  const { questionId } = await params;
  return <SystemQuestionBuilderPage questionId={questionId} />;
}
