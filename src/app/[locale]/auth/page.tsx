import type { Metadata } from 'next';
import AuthPage from '@/features/auth/components/AuthPage';
import { sectionTitleMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return sectionTitleMetadata(locale, 'pages.auth');
}

export default function AuthRoute() {
  return <AuthPage />;
}
