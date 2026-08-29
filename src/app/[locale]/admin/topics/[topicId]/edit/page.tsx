import CategoryBuilderPage from '@/features/admin/categories/components/CategoryBuilderPage';

type EditTopicPageProps = {
  params: Promise<{ topicId: string }>;
};

export default async function EditTopicPage({ params }: EditTopicPageProps) {
  const { topicId } = await params;
  return <CategoryBuilderPage categoryId={topicId} />;
}
