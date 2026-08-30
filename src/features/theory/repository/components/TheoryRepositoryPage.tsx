'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import ConfirmDialog from '@/common/components/ConfirmDialog';
import Select from '@/common/components/Select';
import { invalidateRepositoryCaches } from '@/features/theory/api/invalidate-repository-caches';
import { unsaveRepositoryQuestion } from '@/features/theory/repository/api/mutations';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { repositoryQueryOptions } from '@/features/theory/repository/api/queries';
import type { RepositoryQuestionItem } from '@/features/theory/repository/api/contracts';
import TheoryRepositorySkeleton from './TheoryRepositorySkeleton';
import { useToastStore } from '@/lib/store/use-toast-store';
import { attemptCountClassName } from '@/features/theory/lib/attempt-result-styles';
import { cn } from '@/lib/cn';

function matchesSearch(question: RepositoryQuestionItem, search: string) {
  if (!search) return true;
  return question.question.toLowerCase().includes(search.toLowerCase());
}

function matchesTopic(question: RepositoryQuestionItem, topicId: string | null) {
  if (!topicId) return true;
  return question.topics.some((topic) => topic.id === topicId);
}

function hasAttempts(question: RepositoryQuestionItem) {
  const { incorrect, partial, correct } = question.attempts;
  return incorrect + partial + correct > 0;
}

function AttemptTotals({ question }: { question: RepositoryQuestionItem }) {
  const t = useTranslations('TheoryRepositoryPage');

  if (!hasAttempts(question)) {
    return <span className='text-xs text-muted-foreground'>{t('noAttempts')}</span>;
  }

  const { incorrect, partial, correct } = question.attempts;

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

function QuestionRow({ question }: { question: RepositoryQuestionItem }) {
  const t = useTranslations('TheoryRepositoryPage');
  const queryClient = useQueryClient();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  const { mutate: removeQuestion, isPending: isRemoving } = useMutation({
    mutationFn: () => unsaveRepositoryQuestion(question.id),
    onSuccess: async () => {
      await invalidateRepositoryCaches(queryClient, question.id);
      useToastStore.getState().addToast(t('removeSuccess'), 'success');
      setRemoveDialogOpen(false);
    },
  });

  return (
    <li className='border-b border-border py-4 last:border-b-0'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <Link href={`/theory/${question.id}`} className='text-sm leading-relaxed text-foreground no-underline hover:underline'>
            {question.question}
          </Link>

          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1'>
            {question.topics.length > 0 ? (
              <span className='text-xs text-secondary-foreground'>{question.topics.map((topic) => topic.name).join(' · ')}</span>
            ) : (
              <span className='text-xs text-muted-foreground'>{t('noTopics')}</span>
            )}
            <AttemptTotals question={question} />
          </div>
        </div>

        <div className='flex shrink-0 flex-wrap gap-2 self-start sm:ml-4'>
          {question.canUnsave ? (
            <button type='button' className={secondaryButtonClassName} onClick={() => setRemoveDialogOpen(true)} disabled={isRemoving}>
              {isRemoving ? t('removing') : t('removeFromRepository')}
            </button>
          ) : null}
          <Link href={`/theory/${question.id}/practice`} className={primaryButtonClassName}>
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
        onConfirm={removeQuestion}
      />
    </li>
  );
}

export default function TheoryRepositoryPage() {
  const t = useTranslations('TheoryRepositoryPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(repositoryQueryOptions);

  const [search, setSearch] = useState('');
  const [topicId, setTopicId] = useState<string | null>(null);

  const filteredQuestions = useMemo(() => {
    if (!data) return [];
    return data.questions.filter((question) => matchesSearch(question, search) && matchesTopic(question, topicId));
  }, [topicId, data, search]);

  const topicOptions = useMemo(() => {
    if (!data) return [];
    return [{ value: '', label: t('allTopics') }, ...data.topics.map((topic) => ({ value: topic.id, label: topic.name }))];
  }, [data, t]);

  if (isPending) {
    return (
      <AppShell>
        <TheoryRepositorySkeleton />
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

  const isEmpty = data.questions.length === 0;
  const hasNoMatches = !isEmpty && filteredQuestions.length === 0;
  const questionCount = data.questions.length;

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
              <Link href='/browse' className={secondaryButtonClassName}>
                {t('browseBank')}
              </Link>
              <Link href='/theory/new' className={primaryButtonClassName}>
                {t('createQuestion')}
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
          <p className='m-0 text-xs text-muted-foreground'>{isEmpty ? t('questionCountEmpty') : t('questionCount', { count: questionCount })}</p>
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
              <Link href='/browse' className={secondaryButtonClassName}>
                {t('browseBank')}
              </Link>
              <Link href='/theory/new' className={primaryButtonClassName}>
                {t('createQuestion')}
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
            {filteredQuestions.map((question) => (
              <QuestionRow key={question.id} question={question} />
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
