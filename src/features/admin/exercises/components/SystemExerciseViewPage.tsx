'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import AdminGate from '@/features/admin/components/AdminGate';
import { systemExerciseQueryOptions } from '@/features/admin/exercises/api/queries';
import ExerciseDetailSkeleton from '@/features/exercises/detail/components/ExerciseDetailSkeleton';
import { secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type SystemExerciseViewPageProps = {
  exerciseId: string;
};

export default function SystemExerciseViewPage({ exerciseId }: SystemExerciseViewPageProps) {
  const t = useTranslations('AdminExercisesPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <SystemExerciseViewContent exerciseId={exerciseId} />
    </AdminGate>
  );
}

function SystemExerciseViewContent({ exerciseId }: SystemExerciseViewPageProps) {
  const t = useTranslations('AdminExercisesPage');
  const tDetail = useTranslations('ExerciseDetailPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(systemExerciseQueryOptions(exerciseId));

  if (isPending) {
    return (
      <AppShell>
        <ExerciseDetailSkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <PageLoadError
        title={t('title')}
        message={t('viewLoadError')}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        retryLabel={t('retry')}
        retryingLabel={t('retrying')}
      />
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/admin/exercises' label={t('backToList')} />

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.title}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                <span className={data.isPublic ? 'text-success' : 'text-muted-foreground'}>{data.isPublic ? t('published') : t('draft')}</span>
                {data.topics.length > 0 ? (
                  <TopicList className='text-secondary-foreground' topics={data.topics} />
                ) : (
                  <span className='text-muted-foreground'>{t('noTopics')}</span>
                )}
                <SourceCitation name={data.sourceName} url={data.sourceUrl} />
                {data.allowMultiple ? <span className='text-muted-foreground'>{t('allowMultiple')}</span> : null}
              </div>
            </div>

            <Link href={`/admin/exercises/${exerciseId}/edit`} className={cn(secondaryButtonClassName, 'shrink-0 self-start')}>
              {t('edit')}
            </Link>
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-8'>
          <section>
            <TiptapRenderer content={data.prompt} />
          </section>

          <section>
            <h2 className='m-0 text-xs text-secondary-foreground'>{tDetail('choicesLabel')}</h2>
            <ul className='m-0 mt-3 list-none space-y-3 p-0'>
              {data.choices.map((choice, index) => (
                <li key={index} className='flex items-start gap-3'>
                  <span className='mt-0.5 shrink-0 text-sm text-muted-foreground'>{index + 1}.</span>
                  <div className='min-w-0 flex-1'>
                    <TiptapRenderer content={choice.content} className={cn(choice.isCorrect && 'text-success')} />
                    {choice.isCorrect ? <p className='m-0 mt-1 text-xs text-success'>{tDetail('correctChoice')}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {data.explanation ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-xs text-secondary-foreground'>{tDetail('explanationLabel')}</h2>
              <TiptapRenderer content={data.explanation} className='mt-2' />
            </section>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
