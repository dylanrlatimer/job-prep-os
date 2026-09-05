import type { Metadata } from 'next';
import AuthScreenShell from '@/features/auth/components/AuthScreenShell';
import ForgotPasswordForm from '@/features/auth/components/ForgotPasswordForm';
import { sectionTitleMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    ...(await sectionTitleMetadata(locale, 'pages.forgotPassword')),
    robots: { index: false, follow: false },
  };
}

export default function ForgotPasswordRoute() {
  return (
    <AuthScreenShell>
      <ForgotPasswordForm />
    </AuthScreenShell>
  );
}
