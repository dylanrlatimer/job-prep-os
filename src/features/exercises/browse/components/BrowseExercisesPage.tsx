'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Select from '@/common/components/Select';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { saveExercise } from '@/features/exercises/browse/api/mutations';
import { browseExercisesQueryOptions } from '@/features/exercises/browse/api/queries';
import type { BrowseExerciseItem } from '@/features/exercises/browse/api/contracts';
import ExerciseRepositorySkeleton from '@/features/exercises/repository/components/ExerciseRepositorySkeleton';
import { inputClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

function matchesSearch(exercise: BrowseExerciseItem, search: string) {
  if (!search) return true;
  return exercise.title.toLowerCase().includes(search.toLowerCase());
}

function matchesTopic(exercise: BrowseExerciseItem, topicId: string | null) {
  if (!topicId) return true;
  return exercise.topics.some((topic) => topic.id === topicId);
}

function BrowseExerciseRow({ exercise }: { exercise: BrowseExerciseItem }) {
  const t = useTranslations('BrowseExercisesPage');
  const queryClient = useQueryClient();

  const { mutate: saveExerciseToLibrary, isPending } = useMutation({
    mutationFn: () => saveExercise(exercise.id),
    onSuccess: async () => {
      await invalidateExerciseBrowseCaches(queryClient, exercise.id);
      useToastStore.getState().addToast(t('saveSuccess'), 'success');
    },
  });

  return (
    <li className='border-b border-border py-4 last:border-b-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <Link href={`/exercises/browse/${exercise.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
            {exercise.title}
          </Link>

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            {exercise.isSystem ? <span className='text-secondary-foreground'>{t('systemExercise')}</span> : null}
            {exercise.topics.length > 0 ? (
              <span className='text-secondary-foreground'>{exercise.topics.map((topic) => topic.name).join(' · ')}</span>
            ) : (
              <span className='text-muted-foreground'>{t('noTopics')}</span>
            )}
            {exercise.isSaved ? <span className='text-muted-foreground'>{t('saved')}</span> : null}
          </div>
        </div>

        <button
          type='button'
          className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}
          onClick={() => saveExerciseToLibrary()}
          disabled={exercise.isSaved || isPending}>
          {exercise.isSaved ? t('saved') : isPending ? t('saving') : t('addToRepository')}
        </button>
      </div>
    </li>
  );
}

export default function BrowseExercisesPage() {
  const t = useTranslations('BrowseExercisesPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(browseExercisesQueryOptions);

  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    if (!data) return [];
    return data.exercises.filter((exercise) => matchesSearch(exercise, search) && matchesTopic(exercise, topicId));
  }, [data, search, topicId]);

  const topicOptions = useMemo(() => {
    if (!data) return [{ value: '', label: t('allTopics') }];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  if (isPending) {
    return (
      <AppShell>
        <ExerciseRepositorySkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
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

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <header className='border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
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

        <p className='mt-4 border-b border-border pb-4 text-xs text-muted-foreground'>
          {isEmpty ? t('exerciseCountEmpty') : t('exerciseCount', { count: data.exercises.length })}
        </p>

        {isEmpty ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('emptyTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('emptyDescription')}</p>
          </div>
        ) : hasNoMatches ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('noMatchesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('noMatchesDescription')}</p>
          </div>
        ) : (
          <ul className='m-0 list-none p-0'>
            {filteredExercises.map((exercise) => (
              <BrowseExerciseRow key={exercise.id} exercise={exercise} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
