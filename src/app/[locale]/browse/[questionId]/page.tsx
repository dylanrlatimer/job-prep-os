import BrowseQuestionDetailPage from '@/features/theory/browse/components/BrowseQuestionDetailPage';

type BrowseQuestionPageProps = {
  params: Promise<{ questionId: string }>;
};

export default async function BrowseQuestionPage({ params }: BrowseQuestionPageProps) {
  const { questionId } = await params;
  return <BrowseQuestionDetailPage questionId={questionId} />;
}
