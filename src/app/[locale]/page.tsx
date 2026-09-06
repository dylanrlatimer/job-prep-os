import { Suspense } from 'react';
import type { Metadata } from 'next';
import AppShell from '@/common/components/AppShell';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import TheoryRepositoryPage from '@/features/theory/repository/components/TheoryRepositoryPage';
import { sectionTitleMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.repository');
}

export default function HomePageEntry() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <ListPageSkeleton />
        </AppShell>
      }>
      <TheoryRepositoryPage />
    </Suspense>
  );
}
