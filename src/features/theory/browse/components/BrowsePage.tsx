'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Select from '@/common/components/Select';
import TopicList from '@/common/components/TopicList';
import { invalidateBrowseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { saveExercise } from '@/features/exercises/browse/api/mutations';
import type { BrowseExerciseItem } from '@/features/exercises/browse/api/contracts';
import { saveBrowseQuestion } from '@/features/theory/browse/api/mutations';
import { browsePageQueryOptions } from '@/features/theory/browse/api/queries';
import type { BrowseQuestionItem } from '@/features/theory/browse/api/contracts';
import { BrowsePageQuerySchema, type BrowseKind, type BrowseSavedFilter } from '@/features/theory/browse/lib/browse-filters';
import ListPageLayout, { ListEmptyState } from '@/common/components/ListPageLayout';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import ListPagination from '@/common/components/ListPagination';
import PageLoadError from '@/common/components/PageLoadError';
import { useClampListQuery, useListQueryState } from '@/common/hooks/use-list-query-state';
import { inputClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useRequireAuth } from '@/features/auth/hooks/use-require-auth';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

function BrowseQuestionRow({ question, showType }: { question: BrowseQuestionItem; showType: boolean }) {
  const t = useTranslations('BrowsePage');
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();

  const { mutate: saveQuestion, isPending } = useMutation({
    mutationFn: () => saveBrowseQuestion(question.id),
    onSuccess: async () => {
      await invalidateBrowseCaches(queryClient, question.id);
      useToastStore.getState().addToast(t('saveQuestionSuccess'), 'success');
    },
  });

  return (
    <li className='border-b border-border py-4 last:border-b-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <Link href={`/browse/questions/${question.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
            {question.question}
          </Link>

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            {showType ? <span className='text-secondary-foreground'>{t('typeQuestion')}</span> : null}
            {question.isSystem ? <span className='text-secondary-foreground'>{t('appLabel')}</span> : null}
            {question.topics.length > 0 ? (
              <TopicList className='text-secondary-foreground' topics={question.topics} />
            ) : (
              <span className='text-muted-foreground'>{t('noTopics')}</span>
            )}
            {question.isSaved ? <span className='text-muted-foreground'>{t('saved')}</span> : null}
          </div>
        </div>

        <button
          type='button'
          className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}
          onClick={() => {
            if (!requireAuth()) return;
            saveQuestion();
          }}
          disabled={question.isSaved || isPending}>
          {question.isSaved ? t('saved') : isPending ? t('saving') : t('addQuestionToRepository')}
        </button>
      </div>
    </li>
  );
}

function BrowseExerciseRow({ exercise, showType }: { exercise: BrowseExerciseItem; showType: boolean }) {
  const t = useTranslations('BrowsePage');
  const queryClient = useQueryClient();
  const { requireAuth } = useRequireAuth();

  const { mutate: saveExerciseToLibrary, isPending } = useMutation({
    mutationFn: () => saveExercise(exercise.id),
    onSuccess: async () => {
      await invalidateExerciseBrowseCaches(queryClient, exercise.id);
      useToastStore.getState().addToast(t('saveExerciseSuccess'), 'success');
    },
  });

  return (
    <li className='border-b border-border py-4 last:border-b-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <Link href={`/browse/exercises/${exercise.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
            {exercise.title}
          </Link>

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            {showType ? <span className='text-secondary-foreground'>{t('typeExercise')}</span> : null}
            {exercise.isSystem ? <span className='text-secondary-foreground'>{t('appLabel')}</span> : null}
            {exercise.topics.length > 0 ? (
              <TopicList className='text-secondary-foreground' topics={exercise.topics} />
            ) : (
              <span className='text-muted-foreground'>{t('noTopics')}</span>
            )}
            {exercise.isSaved ? <span className='text-muted-foreground'>{t('saved')}</span> : null}
          </div>
        </div>

        <button
          type='button'
          className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}
          onClick={() => {
            if (!requireAuth()) return;
            saveExerciseToLibrary();
          }}
          disabled={exercise.isSaved || isPending}>
          {exercise.isSaved ? t('saved') : isPending ? t('saving') : t('addExerciseToRepository')}
        </button>
      </div>
    </li>
  );
}

export default function BrowsePage() {
  const t = useTranslations('BrowsePage');
  const { query, setQuery, setPage, searchInput, setSearchInput } = useListQueryState(BrowsePageQuerySchema);
  const { kind, page, search, topicId, saved } = query;
  const listQuery = { page, search, topicId, saved };
  const { data, isPending, isError, refetch, isFetching } = useQuery(browsePageQueryOptions(kind, listQuery));
  useClampListQuery(page, data?.totalCount, setPage);

  const kindOptions = useMemo(
    () => [
      { value: 'all', label: t('kindAll') },
      { value: 'questions', label: t('kindQuestions') },
      { value: 'exercises', label: t('kindExercises') },
    ],
    [t],
  );

  const savedOptions = useMemo(
    () => [
      { value: 'all', label: t('savedAll') },
      { value: 'new', label: t('savedNew') },
      { value: 'saved', label: t('savedSaved') },
    ],
    [t],
  );

  const topicOptions = useMemo(() => {
    if (!data) return [{ value: '', label: t('allTopics') }];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  const handleKindChange = (value: string) => {
    const next: BrowseKind = value === 'questions' || value === 'exercises' ? value : 'all';
    setQuery({ kind: next, topicId: undefined });
  };

  const handleSavedFilterChange = (value: string) => {
    const next: BrowseSavedFilter = value === 'all' || value === 'saved' ? value : 'new';
    setQuery({ saved: next });
  };

  if (isPending) {
    return (
      <AppShell>
        <ListPageLayout title={t('title')} description={t('description')}>
          <ListPageSkeleton omitHeader />
        </ListPageLayout>
      </AppShell>
    );
  }

  if ((isError && !data) || !data) {
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

  const rows = data.items;
  const isEmpty = data.unfilteredCount === 0;
  const hasNoMatches = !isEmpty && data.totalCount === 0;
  const showType = kind === 'all';

  const searchPlaceholder =
    kind === 'questions' ? t('searchQuestionsPlaceholder') : kind === 'exercises' ? t('searchExercisesPlaceholder') : t('searchAllPlaceholder');

  const emptyTitle = kind === 'questions' ? t('emptyQuestionsTitle') : kind === 'exercises' ? t('emptyExercisesTitle') : t('emptyAllTitle');
  const emptyDescription =
    kind === 'questions' ? t('emptyQuestionsDescription') : kind === 'exercises' ? t('emptyExercisesDescription') : t('emptyAllDescription');

  const countLabel = (() => {
    if (isEmpty) {
      if (kind === 'questions') return t('questionCountEmpty');
      if (kind === 'exercises') return t('exerciseCountEmpty');
      return t('itemCountEmpty');
    }

    if (kind === 'questions') return t('questionCount', { count: data.totalCount });
    if (kind === 'exercises') return t('exerciseCount', { count: data.totalCount });
    return t('itemCount', { count: data.totalCount });
  })();

  return (
    <AppShell>
      <ListPageLayout
        title={t('title')}
        description={t('description')}
        filters={
          isEmpty ? undefined : (
            <div className='mt-6 flex flex-col gap-3 lg:flex-row lg:items-center'>
              <label className='block flex-1'>
                <span className='sr-only'>{t('searchLabel')}</span>
                <input
                  className={inputClassName}
                  type='search'
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </label>

              <Select className='w-full lg:w-48' aria-label={t('kindFilterLabel')} value={kind} onValueChange={handleKindChange} options={kindOptions} />

              <Select
                className='w-full lg:w-52'
                aria-label={t('savedFilterLabel')}
                value={saved}
                onValueChange={handleSavedFilterChange}
                options={savedOptions}
              />

              {data.topics.length > 0 ? (
                <Select
                  className='w-full lg:w-44'
                  aria-label={t('topicFilterLabel')}
                  value={topicId ?? ''}
                  onValueChange={(value) => setQuery({ topicId: value || undefined })}
                  options={topicOptions}
                />
              ) : null}
            </div>
          )
        }
        countLabel={countLabel}
        footer={hasNoMatches || isEmpty ? undefined : <ListPagination page={page} totalCount={data.totalCount} onPageChange={setPage} />}>
        {isEmpty ? (
          <ListEmptyState title={emptyTitle} description={emptyDescription} />
        ) : hasNoMatches ? (
          <ListEmptyState title={t('noMatchesTitle')} description={t('noMatchesDescription')} />
        ) : (
          <ul className='m-0 list-none p-0'>
            {rows.map((row) =>
              row.type === 'question' ? (
                <BrowseQuestionRow key={`question-${row.item.id}`} question={row.item} showType={showType} />
              ) : (
                <BrowseExerciseRow key={`exercise-${row.item.id}`} exercise={row.item} showType={showType} />
              ),
            )}
          </ul>
        )}
      </ListPageLayout>
    </AppShell>
  );
}
