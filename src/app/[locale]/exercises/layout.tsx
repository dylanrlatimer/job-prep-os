import type { Metadata } from 'next';
import { sectionTitleMetadata } from '@/lib/seo';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.exercises');
}

export default function ExercisesLayout({ children }: LayoutProps) {
  return children;
}
