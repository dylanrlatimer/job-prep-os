'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { saveExercise } from '@/features/exercises/browse/api/mutations';
import { browseExerciseDetailQueryOptions } from '@/features/exercises/browse/api/queries';
import ExerciseDetailSkeleton from '@/features/exercises/detail/components/ExerciseDetailSkeleton';
import { primaryButtonClassName } from '@/common/styles/form';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { useToastStore } from '@/lib/store/use-toast-store';

type BrowseExerciseDetailPageProps = {
  exerciseId: string;
};

export default function BrowseExerciseDetailPage({ exerciseId }: BrowseExerciseDetailPageProps) {
  const t = useTranslations('BrowseExerciseDetailPage');
  const tBrowse = useTranslations('BrowsePage');
  const tDetail = useTranslations('ExerciseDetailPage');
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();
  const { data, isPending, isError, refetch, isFetching } = useQuery(browseExerciseDetailQueryOptions(exerciseId));

  const { mutate: saveExerciseToLibrary, isPending: isSaving } = useMutation({
    mutationFn: () => saveExercise(exerciseId),
    onSuccess: async () => {
      await invalidateExerciseBrowseCaches(queryClient, exerciseId);
      useToastStore.getState().addToast(tBrowse('saveExerciseSuccess'), 'success');
    },
  });

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
        title={tDetail('title')}
        message={t('loadError')}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        retryLabel={tDetail('retry')}
        retryingLabel={tDetail('retrying')}
      />
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/browse?kind=exercises' label={t('backToBrowse')} />

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.title}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.isSystem ? <span className='text-secondary-foreground'>{tBrowse('appLabel')}</span> : null}
                {data.topics.length > 0 ? (
                  <TopicList className='text-secondary-foreground' topics={data.topics} />
                ) : (
                  <span className='text-muted-foreground'>{tDetail('noTopics')}</span>
                )}

                <SourceCitation name={data.sourceName} url={data.sourceUrl} />

                <span className='text-muted-foreground'>{t('choiceCount', { count: data.choiceCount })}</span>

                {data.isSaved ? <span className='text-muted-foreground'>{tBrowse('saved')}</span> : null}
              </div>
            </div>

            <div className='flex shrink-0 flex-wrap gap-2'>
              {data.isSaved ? (
                <Link href={`/exercises/${exerciseId}/practice`} className={primaryButtonClassName}>
                  {tDetail('practice')}
                </Link>
              ) : (
                <button
                  type='button'
                  className={primaryButtonClassName}
                  onClick={() => {
                    if (!requireAuth()) return;
                    saveExerciseToLibrary();
                  }}
                  disabled={isSaving}>
                  {isSaving ? tBrowse('saving') : tBrowse('addExerciseToRepository')}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl'>
          <TiptapRenderer content={data.prompt} />
        </div>
      </div>
    </AppShell>
  );
}
