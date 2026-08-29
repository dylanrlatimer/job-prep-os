import CategoryBuilderPage from '@/features/admin/categories/components/CategoryBuilderPage';

type EditCategoryPageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { categoryId } = await params;
  return <CategoryBuilderPage categoryId={categoryId} />;
}
