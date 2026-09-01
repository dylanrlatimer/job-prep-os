import type { Metadata } from 'next';
import BrowseExerciseDetailPage from '@/features/exercises/browse/components/BrowseExerciseDetailPage';
import { sectionTitleMetadata } from '@/lib/seo';

type BrowseExercisePageProps = {
  params: Promise<{ locale: string; exerciseId: string }>;
};

export async function generateMetadata({ params }: BrowseExercisePageProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.browseExercise');
}

export default async function BrowseExercisePage({ params }: BrowseExercisePageProps) {
  const { exerciseId } = await params;
  return <BrowseExerciseDetailPage exerciseId={exerciseId} />;
}
