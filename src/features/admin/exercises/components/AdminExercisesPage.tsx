'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import PageLoadError from '@/common/components/PageLoadError';
import Select from '@/common/components/Select';
import TopicList from '@/common/components/TopicList';
import AdminGate from '@/features/admin/components/AdminGate';
import { matchesPublication, matchesText, matchesTopic, type PublicationFilter } from '@/common/lib/list-filters';
import { systemExercisesQueryOptions } from '@/features/admin/exercises/api/queries';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

export default function AdminExercisesPage() {
  const t = useTranslations('AdminExercisesPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <AdminExercisesContent />
    </AdminGate>
  );
}

function AdminExercisesContent() {
  const t = useTranslations('AdminExercisesPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(systemExercisesQueryOptions);

  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);
  const [publication, setPublication] = useState<PublicationFilter>('all');

  const filteredExercises = useMemo(() => {
    if (!data) return [];
    return data.exercises.filter(
      (exercise) => matchesText(exercise.title, search) && matchesTopic(exercise, topicId) && matchesPublication(exercise, publication),
    );
  }, [data, publication, search, topicId]);

  const topicOptions = useMemo(() => {
    if (!data) return [{ value: '', label: t('allTopics') }];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  const publicationOptions = useMemo(
    () => [
      { value: 'all', label: t('allPublication') },
      { value: 'published', label: t('published') },
      { value: 'draft', label: t('draft') },
    ],
    [t],
  );

  if (isPending) {
    return (
      <AppShell>
        <ListPageSkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
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

  const isEmpty = data.exercises.length === 0;
  const hasNoMatches = !isEmpty && filteredExercises.length === 0;

  return (
    <AppShell>
      <ListPageLayout
        title={t('title')}
        description={t('description')}
        headerActions={
          <Link href='/admin/exercises/new' className={cn(primaryButtonClassName, 'shrink-0 self-start')}>
            {t('createExercise')}
          </Link>
        }
        filters={
          isEmpty ? undefined : (
            <div className='mt-6 flex flex-col gap-3 lg:flex-row lg:items-center'>
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
                  className='w-full lg:w-44'
                  aria-label={t('topicFilterLabel')}
                  value={topicId ?? ''}
                  onValueChange={(value) => setTopicId(value || null)}
                  options={topicOptions}
                />
              )}

              <Select
                className='w-full lg:w-44'
                aria-label={t('publicationFilterLabel')}
                value={publication}
                onValueChange={(value) => setPublication(value as PublicationFilter)}
                options={publicationOptions}
              />
            </div>
          )
        }
        countLabel={isEmpty ? t('exerciseCountEmpty') : t('exerciseCount', { count: data.exercises.length })}>
        {isEmpty ? (
          <ListEmptyState title={t('emptyTitle')} description={t('emptyDescription')}>
            <Link href='/admin/exercises/new' className={cn(primaryButtonClassName, 'mt-4 inline-flex')}>
              {t('createExercise')}
            </Link>
          </ListEmptyState>
        ) : hasNoMatches ? (
          <ListEmptyState title={t('noMatchesTitle')} description={t('noMatchesDescription')} />
        ) : (
          <ul className='m-0 list-none p-0'>
            {filteredExercises.map((exercise) => (
              <li key={exercise.id} className='border-b border-border py-4 last:border-b-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <Link href={`/admin/exercises/${exercise.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
                      {exercise.title}
                    </Link>
                    <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                      <span className={exercise.isPublic ? 'text-success' : 'text-muted-foreground'}>{exercise.isPublic ? t('published') : t('draft')}</span>
                      {exercise.topics.length > 0 ? (
                        <TopicList className='text-secondary-foreground' topics={exercise.topics} />
                      ) : (
                        <span className='text-muted-foreground'>{t('noTopics')}</span>
                      )}
                    </div>
                  </div>

                  <Link href={`/admin/exercises/${exercise.id}/edit`} className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}>
                    {t('edit')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ListPageLayout>
    </AppShell>
  );
}
