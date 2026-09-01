import type { Metadata } from 'next';
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
  return <TheoryRepositoryPage />;
}
