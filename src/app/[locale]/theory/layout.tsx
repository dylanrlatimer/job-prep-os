import type { Metadata } from 'next';
import { sectionTitleMetadata } from '@/lib/seo';

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.theory');
}

export default function TheoryLayout({ children }: LayoutProps) {
  return children;
}
