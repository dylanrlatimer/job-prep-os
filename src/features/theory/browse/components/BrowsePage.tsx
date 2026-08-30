'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Select from '@/common/components/Select';
import { invalidateBrowseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { saveExercise } from '@/features/exercises/browse/api/mutations';
import { browseExercisesQueryOptions } from '@/features/exercises/browse/api/queries';
import type { BrowseExerciseItem } from '@/features/exercises/browse/api/contracts';
import { saveBrowseQuestion } from '@/features/theory/browse/api/mutations';
import { browseQueryOptions } from '@/features/theory/browse/api/queries';
import type { BrowseQuestionItem } from '@/features/theory/browse/api/contracts';
import TheoryRepositorySkeleton from '@/features/theory/repository/components/TheoryRepositorySkeleton';
import { inputClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

export type BrowseKind = 'questions' | 'exercises';

type BrowsePageProps = {
  initialKind?: BrowseKind;
};

function matchesQuestionSearch(question: BrowseQuestionItem, search: string) {
  if (!search) return true;
  return question.question.toLowerCase().includes(search.toLowerCase());
}

function matchesExerciseSearch(exercise: BrowseExerciseItem, search: string) {
  if (!search) return true;
  return exercise.title.toLowerCase().includes(search.toLowerCase());
}

function matchesTopic<T extends { topics: Array<{ id: string }> }>(item: T, topicId: string | null) {
  if (!topicId) return true;
  return item.topics.some((topic) => topic.id === topicId);
}

function BrowseQuestionRow({ question }: { question: BrowseQuestionItem }) {
  const t = useTranslations('BrowsePage');
  const queryClient = useQueryClient();

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
            {question.isSystem ? <span className='text-secondary-foreground'>{t('appLabel')}</span> : null}
            {question.topics.length > 0 ? (
              <span className='text-secondary-foreground'>{question.topics.map((topic) => topic.name).join(' · ')}</span>
            ) : (
              <span className='text-muted-foreground'>{t('noTopics')}</span>
            )}
            {question.isSaved ? <span className='text-muted-foreground'>{t('saved')}</span> : null}
          </div>
        </div>

        <button
          type='button'
          className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}
          onClick={() => saveQuestion()}
          disabled={question.isSaved || isPending}>
          {question.isSaved ? t('saved') : isPending ? t('saving') : t('addQuestionToRepository')}
        </button>
      </div>
    </li>
  );
}

function BrowseExerciseRow({ exercise }: { exercise: BrowseExerciseItem }) {
  const t = useTranslations('BrowsePage');
  const queryClient = useQueryClient();

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
            {exercise.isSystem ? <span className='text-secondary-foreground'>{t('appLabel')}</span> : null}
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
          {exercise.isSaved ? t('saved') : isPending ? t('saving') : t('addExerciseToRepository')}
        </button>
      </div>
    </li>
  );
}

export default function BrowsePage({ initialKind = 'questions' }: BrowsePageProps) {
  const t = useTranslations('BrowsePage');
  const router = useRouter();

  const [kind, setKind] = useState<BrowseKind>(initialKind);
  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);

  useEffect(() => {
    setKind(initialKind);
    setTopicId(null);
  }, [initialKind]);

  const questionsQuery = useQuery({
    ...browseQueryOptions,
    enabled: kind === 'questions',
  });
  const exercisesQuery = useQuery({
    ...browseExercisesQueryOptions,
    enabled: kind === 'exercises',
  });

  const activeQuery = kind === 'questions' ? questionsQuery : exercisesQuery;
  const { isPending, isError, refetch, isFetching } = activeQuery;

  const kindOptions = useMemo(
    () => [
      { value: 'questions', label: t('kindQuestions') },
      { value: 'exercises', label: t('kindExercises') },
    ],
    [t],
  );

  const topics = kind === 'questions' ? (questionsQuery.data?.topics ?? []) : (exercisesQuery.data?.topics ?? []);

  const topicOptions = useMemo(() => [{ value: '', label: t('allTopics') }, ...topics.map((topic) => ({ value: topic.id, label: topic.name }))], [t, topics]);

  const filteredQuestions = useMemo(() => {
    if (!questionsQuery.data) return [];
    return questionsQuery.data.questions.filter((question) => matchesQuestionSearch(question, search) && matchesTopic(question, topicId));
  }, [questionsQuery.data, search, topicId]);

  const filteredExercises = useMemo(() => {
    if (!exercisesQuery.data) return [];
    return exercisesQuery.data.exercises.filter((exercise) => matchesExerciseSearch(exercise, search) && matchesTopic(exercise, topicId));
  }, [exercisesQuery.data, search, topicId]);

  const handleKindChange = (value: string) => {
    const next: BrowseKind = value === 'exercises' ? 'exercises' : 'questions';
    setKind(next);
    setTopicId(null);
    router.replace(next === 'exercises' ? '/browse?kind=exercises' : '/browse');
  };

  if (isPending) {
    return (
      <AppShell>
        <TheoryRepositorySkeleton />
      </AppShell>
    );
  }

  if (isError || (kind === 'questions' ? !questionsQuery.data : !exercisesQuery.data)) {
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

  const bankSize = kind === 'questions' ? (questionsQuery.data?.questions.length ?? 0) : (exercisesQuery.data?.exercises.length ?? 0);
  const filteredCount = kind === 'questions' ? filteredQuestions.length : filteredExercises.length;
  const isEmpty = bankSize === 0;
  const hasNoMatches = !isEmpty && filteredCount === 0;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <header className='border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
        </header>

        <div className='mt-6 flex flex-col gap-3 lg:flex-row lg:items-center'>
          <label className='block flex-1'>
            <span className='sr-only'>{t('searchLabel')}</span>
            <input
              className={inputClassName}
              type='search'
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={kind === 'questions' ? t('searchQuestionsPlaceholder') : t('searchExercisesPlaceholder')}
              disabled={isEmpty}
            />
          </label>

          <Select className='w-full lg:w-44' aria-label={t('kindFilterLabel')} value={kind} onValueChange={handleKindChange} options={kindOptions} />

          {topics.length > 0 ? (
            <Select
              className='w-full lg:w-44'
              aria-label={t('topicFilterLabel')}
              value={topicId ?? ''}
              onValueChange={(value) => setTopicId(value || null)}
              options={topicOptions}
            />
          ) : null}
        </div>

        <p className='mt-4 border-b border-border pb-4 text-xs text-muted-foreground'>
          {isEmpty
            ? kind === 'questions'
              ? t('questionCountEmpty')
              : t('exerciseCountEmpty')
            : kind === 'questions'
              ? t('questionCount', { count: bankSize })
              : t('exerciseCount', { count: bankSize })}
        </p>

        {isEmpty ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{kind === 'questions' ? t('emptyQuestionsTitle') : t('emptyExercisesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{kind === 'questions' ? t('emptyQuestionsDescription') : t('emptyExercisesDescription')}</p>
          </div>
        ) : hasNoMatches ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('noMatchesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('noMatchesDescription')}</p>
          </div>
        ) : (
          <ul className='m-0 list-none p-0'>
            {kind === 'questions'
              ? filteredQuestions.map((question) => <BrowseQuestionRow key={question.id} question={question} />)
              : filteredExercises.map((exercise) => <BrowseExerciseRow key={exercise.id} exercise={exercise} />)}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
