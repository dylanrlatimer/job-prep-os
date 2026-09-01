import type { Metadata } from 'next';
import BrowseQuestionDetailPage from '@/features/theory/browse/components/BrowseQuestionDetailPage';
import { sectionTitleMetadata } from '@/lib/seo';

type BrowseQuestionPageProps = {
  params: Promise<{ locale: string; questionId: string }>;
};

export async function generateMetadata({ params }: BrowseQuestionPageProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.browseQuestion');
}

export default async function BrowseQuestionPage({ params }: BrowseQuestionPageProps) {
  const { questionId } = await params;
  return <BrowseQuestionDetailPage questionId={questionId} />;
}
