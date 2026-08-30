'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ConfirmDialog from '@/common/components/ConfirmDialog';
import Select from '@/common/components/Select';
import { invalidateExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { unsaveExercise } from '@/features/exercises/repository/api/mutations';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { exerciseRepositoryQueryOptions } from '@/features/exercises/repository/api/queries';
import type { RepositoryExerciseItem } from '@/features/exercises/repository/api/contracts';
import ExerciseRepositorySkeleton from './ExerciseRepositorySkeleton';
import { useToastStore } from '@/lib/store/use-toast-store';
import { attemptCountClassName } from '@/features/theory/lib/attempt-result-styles';
import { cn } from '@/lib/cn';

function matchesSearch(exercise: RepositoryExerciseItem, search: string) {
  if (!search) return true;
  return exercise.title.toLowerCase().includes(search.toLowerCase());
}

function matchesTopic(exercise: RepositoryExerciseItem, topicId: string | null) {
  if (!topicId) return true;
  return exercise.topics.some((topic) => topic.id === topicId);
}

function hasAttempts(exercise: RepositoryExerciseItem) {
  const { incorrect, partial, correct } = exercise.attempts;
  return incorrect + partial + correct > 0;
}

function AttemptTotals({ exercise }: { exercise: RepositoryExerciseItem }) {
  const t = useTranslations('ExerciseRepositoryPage');

  if (!hasAttempts(exercise)) {
    return <span className='text-xs text-muted-foreground'>{t('noAttempts')}</span>;
  }

  const { incorrect, partial, correct } = exercise.attempts;

  return (
    <span className='text-xs'>
      <span className={attemptCountClassName(incorrect, 'incorrect')}>{t('attemptIncorrect', { count: incorrect })}</span>
      <span className='text-muted-foreground'> · </span>
      <span className={attemptCountClassName(partial, 'partial')}>{t('attemptPartial', { count: partial })}</span>
      <span className='text-muted-foreground'> · </span>
      <span className={attemptCountClassName(correct, 'correct')}>{t('attemptCorrect', { count: correct })}</span>
    </span>
  );
}

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
              <span className='text-xs text-secondary-foreground'>{exercise.topics.map((topic) => topic.name).join(' · ')}</span>
            ) : (
              <span className='text-xs text-muted-foreground'>{t('noTopics')}</span>
            )}
            <AttemptTotals exercise={exercise} />
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
  const { data, isPending, isError, refetch, isFetching } = useQuery(exerciseRepositoryQueryOptions);

  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    if (!data) return [];
    return data.exercises.filter((exercise) => matchesSearch(exercise, search) && matchesTopic(exercise, topicId));
  }, [data, search, topicId]);

  const topicOptions = useMemo(() => {
    if (!data) return [];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  if (isPending) {
    return (
      <AppShell>
        <ExerciseRepositorySkeleton />
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t('retrying') : t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  const isEmpty = data.exercises.length === 0;
  const hasNoMatches = !isEmpty && filteredExercises.length === 0;
  const exerciseCount = data.exercises.length;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <header className='border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
            </div>

            <div className='flex shrink-0 flex-wrap gap-2'>
              <Link href='/browse?kind=exercises' className={secondaryButtonClassName}>
                {t('browseBank')}
              </Link>
              <Link href='/exercises/new' className={primaryButtonClassName}>
                {t('createExercise')}
              </Link>
            </div>
          </div>
        </header>

        {!isEmpty && (
          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <label className='block flex-1'>
              <span className='sr-only'>{t('searchLabel')}</span>
              <input
                className={inputClassName}
                type='search'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </label>

            {data.topics.length > 0 && (
              <Select
                className='w-full sm:w-44'
                aria-label={t('topicFilterLabel')}
                value={topicId ?? ''}
                onValueChange={(value) => setTopicId(value || null)}
                options={topicOptions}
              />
            )}
          </div>
        )}

        <div className='mt-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between'>
          <p className='m-0 text-xs text-muted-foreground'>{isEmpty ? t('exerciseCountEmpty') : t('exerciseCount', { count: exerciseCount })}</p>
          {!isEmpty && (
            <button type='button' className={cn(secondaryButtonClassName, 'self-start sm:self-auto')} disabled>
              {t('exportCsv')}
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('emptyTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('emptyDescription')}</p>
            <div className='mt-4 flex flex-wrap gap-2'>
              <Link href='/browse?kind=exercises' className={secondaryButtonClassName}>
                {t('browseBank')}
              </Link>
              <Link href='/exercises/new' className={primaryButtonClassName}>
                {t('createExercise')}
              </Link>
            </div>
          </div>
        ) : hasNoMatches ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('noMatchesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('noMatchesDescription')}</p>
          </div>
        ) : (
          <ul className='m-0 list-none p-0'>
            {filteredExercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
