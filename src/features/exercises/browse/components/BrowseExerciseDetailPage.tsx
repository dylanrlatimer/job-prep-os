'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { saveExercise } from '@/features/exercises/browse/api/mutations';
import { browseExerciseDetailQueryOptions } from '@/features/exercises/browse/api/queries';
import ExerciseDetailSkeleton from '@/features/exercises/detail/components/ExerciseDetailSkeleton';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

type BrowseExerciseDetailPageProps = {
  exerciseId: string;
};

export default function BrowseExerciseDetailPage({ exerciseId }: BrowseExerciseDetailPageProps) {
  const t = useTranslations('BrowseExerciseDetailPage');
  const tBrowse = useTranslations('BrowseExercisesPage');
  const tDetail = useTranslations('ExerciseDetailPage');
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch, isFetching } = useQuery(browseExerciseDetailQueryOptions(exerciseId));

  const { mutate: saveExerciseToLibrary, isPending: isSaving } = useMutation({
    mutationFn: () => saveExercise(exerciseId),
    onSuccess: async () => {
      await invalidateExerciseBrowseCaches(queryClient, exerciseId);
      useToastStore.getState().addToast(tBrowse('saveSuccess'), 'success');
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
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{tDetail('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? tDetail('retrying') : tDetail('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link href='/exercises/browse' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToBrowse')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <TiptapRenderer content={data.prompt} className='text-lg font-medium leading-relaxed text-foreground' />

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.isSystem ? <span className='text-secondary-foreground'>{tBrowse('systemExercise')}</span> : null}
                {data.topics.length > 0 ? (
                  <span className='text-secondary-foreground'>{data.topics.map((topic) => topic.name).join(' · ')}</span>
                ) : (
                  <span className='text-muted-foreground'>{tDetail('uncategorized')}</span>
                )}

                {data.sourceName ? (
                  <span className='text-secondary-foreground'>
                    {data.sourceUrl ? (
                      <a href={data.sourceUrl} target='_blank' rel='noopener noreferrer' className='text-link underline-offset-2 hover:underline'>
                        {data.sourceName}
                      </a>
                    ) : (
                      data.sourceName
                    )}
                  </span>
                ) : null}

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
                <button type='button' className={primaryButtonClassName} onClick={() => saveExerciseToLibrary()} disabled={isSaving}>
                  {isSaving ? tBrowse('saving') : tBrowse('addToRepository')}
                </button>
              )}
            </div>
          </div>
        </header>
      </div>
    </AppShell>
  );
}
