import type { Metadata } from 'next';
import AuthScreenShell from '@/features/auth/components/AuthScreenShell';
import UpdatePasswordForm, { UpdatePasswordExpired } from '@/features/auth/components/UpdatePasswordForm';
import { getSession } from '@/features/auth/server/get-session';
import { sectionTitleMetadata } from '@/lib/seo';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return {
    ...(await sectionTitleMetadata(locale, 'pages.updatePassword')),
    robots: { index: false, follow: false },
    other: {
      referrer: 'no-referrer',
    },
  };
}

export default async function UpdatePasswordRoute() {
  const { user } = await getSession();

  return <AuthScreenShell>{user ? <UpdatePasswordForm /> : <UpdatePasswordExpired />}</AuthScreenShell>;
}
