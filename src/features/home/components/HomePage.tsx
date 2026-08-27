import { getTranslations } from 'next-intl/server';
import HomeAuthButton from './HomeAuthButton';
import LocaleSwitcher from './LocaleSwitcher';

export default async function HomePage() {
  const t = await getTranslations('HomePage');

  return (
    <main className='flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10 text-center text-foreground sm:px-6 sm:py-14'>
      <h1 className='mb-4 text-4xl font-extrabold leading-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl'>{t('title')}</h1>
      <p className='text-base font-medium text-muted-foreground sm:text-lg md:text-xl lg:text-2xl'>{t('subtitle')}</p>
      <HomeAuthButton />
      <LocaleSwitcher />
    </main>
  );
}
