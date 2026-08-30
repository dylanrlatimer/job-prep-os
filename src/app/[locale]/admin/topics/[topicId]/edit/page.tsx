import TopicBuilderPage from '@/features/admin/topics/components/TopicBuilderPage';

type PageProps = {
  params: Promise<{ topicId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { topicId } = await params;
  return <TopicBuilderPage topicId={topicId} />;
}
