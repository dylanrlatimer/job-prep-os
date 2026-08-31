'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Select from '@/common/components/Select';
import TopicList from '@/common/components/TopicList';
import { invalidateBrowseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import { saveExercise } from '@/features/exercises/browse/api/mutations';
import { browseExercisesQueryOptions } from '@/features/exercises/browse/api/queries';
import type { BrowseExerciseItem } from '@/features/exercises/browse/api/contracts';
import { saveBrowseQuestion } from '@/features/theory/browse/api/mutations';
import { browseQueryOptions } from '@/features/theory/browse/api/queries';
import type { BrowseQuestionItem } from '@/features/theory/browse/api/contracts';
import { browseHref, matchesSaved, matchesTopic, type BrowseKind, type BrowseSavedFilter } from '@/features/theory/browse/lib/browse-filters';
import TheoryRepositorySkeleton from '@/features/theory/repository/components/TheoryRepositorySkeleton';
import { inputClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

type BrowsePageProps = {
  initialKind?: BrowseKind;
};

type BrowseRow =
  | { type: 'question'; item: BrowseQuestionItem }
  | { type: 'exercise'; item: BrowseExerciseItem };

function matchesQuestionSearch(question: BrowseQuestionItem, search: string) {
  if (!search) return true;
  return question.question.toLowerCase().includes(search.toLowerCase());
}

function matchesExerciseSearch(exercise: BrowseExerciseItem, search: string) {
  if (!search) return true;
  return exercise.title.toLowerCase().includes(search.toLowerCase());
}

function mergeTopics(questionTopics: BrowseQuestionItem['topics'], exerciseTopics: BrowseExerciseItem['topics']) {
  const topics = new Map<string, BrowseQuestionItem['topics'][number]>();

  for (const topic of [...questionTopics, ...exerciseTopics]) {
    topics.set(topic.id, topic);
  }

  return [...topics.values()].sort((left, right) => left.name.localeCompare(right.name));
}

function BrowseQuestionRow({ question, showType }: { question: BrowseQuestionItem; showType: boolean }) {
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
          onClick={() => saveQuestion()}
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
          onClick={() => saveExerciseToLibrary()}
          disabled={exercise.isSaved || isPending}>
          {exercise.isSaved ? t('saved') : isPending ? t('saving') : t('addExerciseToRepository')}
        </button>
      </div>
    </li>
  );
}

export default function BrowsePage({ initialKind = 'all' }: BrowsePageProps) {
  const t = useTranslations('BrowsePage');
  const router = useRouter();

  const [kind, setKind] = useState<BrowseKind>(initialKind);
  const [savedFilter, setSavedFilter] = useState<BrowseSavedFilter>('new');
  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);

  const includeQuestions = kind !== 'exercises';
  const includeExercises = kind !== 'questions';

  useEffect(() => {
    setKind(initialKind);
    setTopicId(null);
  }, [initialKind]);

  const questionsQuery = useQuery({
    ...browseQueryOptions,
    enabled: includeQuestions,
  });
  const exercisesQuery = useQuery({
    ...browseExercisesQueryOptions,
    enabled: includeExercises,
  });

  const isPending = (includeQuestions && questionsQuery.isPending) || (includeExercises && exercisesQuery.isPending);
  const isError = (includeQuestions && questionsQuery.isError) || (includeExercises && exercisesQuery.isError);
  const isFetching = questionsQuery.isFetching || exercisesQuery.isFetching;

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

  const topics = useMemo(() => {
    const questionTopics = includeQuestions ? (questionsQuery.data?.topics ?? []) : [];
    const exerciseTopics = includeExercises ? (exercisesQuery.data?.topics ?? []) : [];
    return includeQuestions && includeExercises ? mergeTopics(questionTopics, exerciseTopics) : includeQuestions ? questionTopics : exerciseTopics;
  }, [includeExercises, includeQuestions, exercisesQuery.data?.topics, questionsQuery.data?.topics]);

  const topicOptions = useMemo(() => [{ value: '', label: t('allTopics') }, ...topics.map((topic) => ({ value: topic.id, label: topic.name }))], [t, topics]);

  const filteredQuestions = useMemo(() => {
    if (!includeQuestions || !questionsQuery.data) return [];
    return questionsQuery.data.questions.filter(
      (question) => matchesQuestionSearch(question, search) && matchesTopic(question, topicId) && matchesSaved(question.isSaved, savedFilter),
    );
  }, [includeQuestions, questionsQuery.data, search, topicId, savedFilter]);

  const filteredExercises = useMemo(() => {
    if (!includeExercises || !exercisesQuery.data) return [];
    return exercisesQuery.data.exercises.filter(
      (exercise) => matchesExerciseSearch(exercise, search) && matchesTopic(exercise, topicId) && matchesSaved(exercise.isSaved, savedFilter),
    );
  }, [includeExercises, exercisesQuery.data, search, topicId, savedFilter]);

  const rows = useMemo<BrowseRow[]>(() => {
    const questionRows: BrowseRow[] = filteredQuestions.map((item) => ({ type: 'question', item }));
    const exerciseRows: BrowseRow[] = filteredExercises.map((item) => ({ type: 'exercise', item }));

    if (!includeQuestions) return exerciseRows;
    if (!includeExercises) return questionRows;

    return [...questionRows, ...exerciseRows].sort((left, right) => right.item.createdAt.localeCompare(left.item.createdAt));
  }, [filteredExercises, filteredQuestions, includeExercises, includeQuestions]);

  const handleKindChange = (value: string) => {
    const next: BrowseKind = value === 'questions' || value === 'exercises' ? value : 'all';
    setKind(next);
    setTopicId(null);
    router.replace(browseHref(next));
  };

  const handleSavedFilterChange = (value: string) => {
    if (value === 'all' || value === 'saved') {
      setSavedFilter(value);
      return;
    }

    setSavedFilter('new');
  };

  const refetch = () => {
    if (includeQuestions) {
      void questionsQuery.refetch();
    }
    if (includeExercises) {
      void exercisesQuery.refetch();
    }
  };

  if (isPending) {
    return (
      <AppShell>
        <TheoryRepositorySkeleton />
      </AppShell>
    );
  }

  const questionsMissing = includeQuestions && !questionsQuery.data;
  const exercisesMissing = includeExercises && !exercisesQuery.data;

  if (isError || questionsMissing || exercisesMissing) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={refetch} disabled={isFetching}>
            {isFetching ? t('retrying') : t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  const questionBankSize = includeQuestions ? (questionsQuery.data?.questions.length ?? 0) : 0;
  const exerciseBankSize = includeExercises ? (exercisesQuery.data?.exercises.length ?? 0) : 0;
  const bankSize = questionBankSize + exerciseBankSize;
  const isEmpty = bankSize === 0;
  const hasNoMatches = !isEmpty && rows.length === 0;
  const showType = kind === 'all';

  const searchPlaceholder = kind === 'questions' ? t('searchQuestionsPlaceholder') : kind === 'exercises' ? t('searchExercisesPlaceholder') : t('searchAllPlaceholder');

  const emptyTitle = kind === 'questions' ? t('emptyQuestionsTitle') : kind === 'exercises' ? t('emptyExercisesTitle') : t('emptyAllTitle');
  const emptyDescription =
    kind === 'questions' ? t('emptyQuestionsDescription') : kind === 'exercises' ? t('emptyExercisesDescription') : t('emptyAllDescription');

  const countLabel = (() => {
    if (isEmpty) {
      if (kind === 'questions') return t('questionCountEmpty');
      if (kind === 'exercises') return t('exerciseCountEmpty');
      return t('itemCountEmpty');
    }

    if (kind === 'questions') return t('questionCount', { count: rows.length });
    if (kind === 'exercises') return t('exerciseCount', { count: rows.length });
    return t('itemCount', { count: rows.length });
  })();

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
              placeholder={searchPlaceholder}
              disabled={isEmpty}
            />
          </label>

          <Select className='w-full lg:w-48' aria-label={t('kindFilterLabel')} value={kind} onValueChange={handleKindChange} options={kindOptions} />

          <Select
            className='w-full lg:w-52'
            aria-label={t('savedFilterLabel')}
            value={savedFilter}
            onValueChange={handleSavedFilterChange}
            options={savedOptions}
          />

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

        <p className='mt-4 border-b border-border pb-4 text-xs text-muted-foreground'>{countLabel}</p>

        {isEmpty ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{emptyTitle}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{emptyDescription}</p>
          </div>
        ) : hasNoMatches ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('noMatchesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('noMatchesDescription')}</p>
          </div>
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
      </div>
    </AppShell>
  );
}
