import QuestionBuilderPage from '@/features/theory/builder/components/QuestionBuilderPage';

type EditQuestionPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function EditQuestionPage({ params }: EditQuestionPageProps) {
  const { questionId } = await params;
  return <QuestionBuilderPage questionId={questionId} />;
}
