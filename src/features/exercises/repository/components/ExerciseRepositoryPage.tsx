'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import AttemptTotals from '@/common/components/AttemptTotals';
import ConfirmDialog from '@/common/components/ConfirmDialog';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import ListPagination from '@/common/components/ListPagination';
import PageLoadError from '@/common/components/PageLoadError';
import Select from '@/common/components/Select';
import TopicList from '@/common/components/TopicList';
import { useClampListQuery, useListQueryState } from '@/common/hooks/use-list-query-state';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidateExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { unsaveExercise } from '@/features/exercises/repository/api/mutations';
import { exerciseRepositoryQueryOptions } from '@/features/exercises/repository/api/queries';
import { ExerciseRepositoryListQuerySchema, type RepositoryExerciseItem } from '@/features/exercises/repository/api/contracts';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

function ExerciseRow({ exercise }: { exercise: RepositoryExerciseItem }) {
  const t = useTranslations('ExerciseRepositoryPage');
  const queryClient = useQueryClient();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { mutate: removeExercise, isPending: isRemoving } = useMutation({
    mutationFn: () => unsaveExercise(exercise.id),
    onSuccess: async () => {
      await invalidateExerciseCaches(queryClient, exercise.id);
      useToastStore.getState().addToast(t('removeSuccess'), 'success');
      setRemoveDialogOpen(false);
    },
  });

  return (
    <li className='border-b border-border py-4 last:border-b-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <Link href={`/exercises/${exercise.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
            {exercise.title}
          </Link>

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1'>
            {exercise.topics.length > 0 ? (
              <TopicList className='text-xs text-secondary-foreground' topics={exercise.topics} />
            ) : (
              <span className='text-xs text-muted-foreground'>{t('noTopics')}</span>
            )}
            <AttemptTotals
              attempts={exercise.attempts}
              incorrectLabel={t('attemptIncorrect', { count: exercise.attempts.incorrect })}
              partialLabel={t('attemptPartial', { count: exercise.attempts.partial })}
              correctLabel={t('attemptCorrect', { count: exercise.attempts.correct })}
              emptyLabel={t('noAttempts')}
            />
          </div>
        </div>

        <div className='flex shrink-0 flex-wrap gap-2 self-start sm:ml-4'>
          {exercise.canUnsave ? (
            <button type='button' className={secondaryButtonClassName} onClick={() => setRemoveDialogOpen(true)} disabled={isRemoving}>
              {isRemoving ? t('removing') : t('removeFromRepository')}
            </button>
          ) : null}
          <Link href={`/exercises/${exercise.id}/practice`} className={primaryButtonClassName}>
            {t('practice')}
          </Link>
        </div>
      </div>

      <ConfirmDialog
        open={removeDialogOpen}
        title={t('removeConfirmTitle')}
        description={t('removeConfirmDescription')}
        cancelLabel={t('removeCancel')}
        confirmLabel={isRemoving ? t('removing') : t('removeFromRepository')}
        confirmVariant='destructive'
        isConfirming={isRemoving}
        onCancel={() => setRemoveDialogOpen(false)}
        onConfirm={removeExercise}
      />
    </li>
  );
}

export default function ExerciseRepositoryPage() {
  const t = useTranslations('ExerciseRepositoryPage');
  const { query, setQuery, setPage, searchInput, setSearchInput } = useListQueryState(ExerciseRepositoryListQuerySchema);
  const { data, isPending, isError, refetch, isFetching } = useQuery(exerciseRepositoryQueryOptions(query));
  useClampListQuery(query.page, data?.totalCount, setPage);

  const topicOptions = useMemo(() => {
    if (!data) return [];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  if (isPending) {
    return (
      <AppShell>
        <ListPageSkeleton />
      </AppShell>
    );
  }

  if (isError && !data) {
    return (
      <PageLoadError
        title={t('title')}
        message={t('loadError')}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        retryLabel={t('retry')}
        retryingLabel={t('retrying')}
      />
    );
  }

  if (!data) {
    return null;
  }

  const isEmpty = data.unfilteredCount === 0;
  const hasNoMatches = !isEmpty && data.totalCount === 0;

  return (
    <AppShell>
      <ListPageLayout
        title={t('title')}
        description={t('description')}
        headerActions={
          <div className='flex shrink-0 flex-wrap gap-2'>
            <Link href='/browse?kind=exercises' className={secondaryButtonClassName}>
              {t('browseBank')}
            </Link>
            <Link href='/exercises/new' className={primaryButtonClassName}>
              {t('createExercise')}
            </Link>
          </div>
        }
        filters={
          isEmpty ? undefined : (
            <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
              <label className='block flex-1'>
                <span className='sr-only'>{t('searchLabel')}</span>
                <input
                  className={inputClassName}
                  type='search'
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t('searchPlaceholder')}
                />
              </label>

              {data.topics.length > 0 && (
                <Select
                  className='w-full sm:w-44'
                  aria-label={t('topicFilterLabel')}
                  value={query.topicId ?? ''}
                  onValueChange={(value) => setQuery({ topicId: value || undefined })}
                  options={topicOptions}
                />
              )}
            </div>
          )
        }
        countLabel={isEmpty ? t('exerciseCountEmpty') : t('exerciseCount', { count: data.totalCount })}
        countExtra={
          isEmpty ? undefined : (
            <button type='button' className={cn(secondaryButtonClassName, 'self-start sm:self-auto')} disabled>
              {t('exportCsv')}
            </button>
          )
        }
        footer={hasNoMatches || isEmpty ? undefined : <ListPagination page={query.page} totalCount={data.totalCount} onPageChange={setPage} />}>
        {isEmpty ? (
          <ListEmptyState title={t('emptyTitle')} description={t('emptyDescription')}>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Link href='/browse?kind=exercises' className={secondaryButtonClassName}>
                {t('browseBank')}
              </Link>
              <Link href='/exercises/new' className={primaryButtonClassName}>
                {t('createExercise')}
              </Link>
            </div>
          </ListEmptyState>
        ) : hasNoMatches ? (
          <ListEmptyState title={t('noMatchesTitle')} description={t('noMatchesDescription')} />
        ) : (
          <ul className='m-0 list-none p-0'>
            {data.exercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </ul>
        )}
      </ListPageLayout>
    </AppShell>
  );
}
