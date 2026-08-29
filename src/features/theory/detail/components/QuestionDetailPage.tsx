'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import AttemptTotals from '@/common/components/AttemptTotals';
import ConfirmDialog from '@/common/components/ConfirmDialog';
import { invalidateRepositoryCaches } from '@/features/theory/api/invalidate-repository-caches';
import { questionDetailQueryOptions } from '@/features/theory/detail/api/queries';
import { unsaveRepositoryQuestion } from '@/features/theory/repository/api/mutations';
import { attemptResultClassName } from '@/features/theory/lib/attempt-result-styles';
import type { PracticeAttemptResult } from '@/features/theory/practice/api/contracts';
import QuestionDetailSkeleton from './QuestionDetailSkeleton';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

type QuestionDetailPageProps = {
  questionId: string;
};

function hasAttempts(totals: { incorrect: number; partial: number; correct: number }) {
  return totals.incorrect + totals.partial + totals.correct > 0;
}

function resultLabelKey(result: PracticeAttemptResult) {
  if (result === 'incorrect') return 'resultIncorrect' as const;
  if (result === 'partial') return 'resultPartial' as const;
  return 'resultCorrect' as const;
}

export default function QuestionDetailPage({ questionId }: QuestionDetailPageProps) {
  const t = useTranslations('QuestionDetailPage');
  const tRepo = useTranslations('TheoryRepositoryPage');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const { data, isPending, isError, refetch, isFetching } = useQuery(questionDetailQueryOptions(questionId));

  const { mutate: removeQuestion, isPending: isRemoving } = useMutation({
    mutationFn: () => unsaveRepositoryQuestion(questionId),
    onSuccess: async () => {
      await invalidateRepositoryCaches(queryClient, questionId);
      useToastStore.getState().addToast(tRepo('removeSuccess'), 'success');
      router.push('/');
    },
  });

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  if (isPending) {
    return (
      <AppShell>
        <QuestionDetailSkeleton />
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

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link href='/' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToRepository')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.question}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.categories.length > 0 ? (
                  <span className='text-secondary-foreground'>{data.categories.map((category) => category.name).join(' · ')}</span>
                ) : (
                  <span className='text-muted-foreground'>{t('uncategorized')}</span>
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

                <span className='text-muted-foreground'>{data.isPublic ? t('visibilityPublic') : t('visibilityPrivate')}</span>

                {hasAttempts(data.attempts) ? (
                  <AttemptTotals
                    attempts={data.attempts}
                    incorrectLabel={t('attemptIncorrect', { count: data.attempts.incorrect })}
                    partialLabel={t('attemptPartial', { count: data.attempts.partial })}
                    correctLabel={t('attemptCorrect', { count: data.attempts.correct })}
                  />
                ) : (
                  <span className='text-muted-foreground'>{t('noAttempts')}</span>
                )}
              </div>
            </div>

            <div className='flex shrink-0 flex-wrap gap-2'>
              {data.isOwner ? (
                <Link href={`/theory/${questionId}/edit`} className={secondaryButtonClassName}>
                  {t('edit')}
                </Link>
              ) : null}
              <Link href={`/theory/${questionId}/practice`} className={primaryButtonClassName}>
                {t('practice')}
              </Link>
            </div>
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-8'>
          <section>
            <h2 className='m-0 text-xs text-secondary-foreground'>{t('referenceAnswerLabel')}</h2>
            <TiptapRenderer content={data.answer} className='mt-2' />
          </section>

          <section className='border-t border-border pt-6'>
            <h2 className='m-0 text-sm font-medium text-foreground'>{t('historyTitle')}</h2>

            {data.attemptHistory.length === 0 ? (
              <p className='mt-3 text-sm text-muted-foreground'>{t('historyEmpty')}</p>
            ) : (
              <ul className='m-0 mt-4 list-none p-0'>
                {data.attemptHistory.map((attempt, index) => (
                  <li key={attempt.id} className={cn(index > 0 && 'mt-4 border-t border-border pt-4')}>
                    <p className='m-0 text-sm'>
                      <span className='text-muted-foreground'>{formatDate(attempt.createdAt)}</span>
                      <span className='text-muted-foreground'> · </span>
                      <span className={attemptResultClassName(attempt.result)}>{t(resultLabelKey(attempt.result))}</span>
                    </p>
                    {attempt.response ? (
                      <div className='mt-2'>
                        <p className='m-0 mb-1 text-xs text-secondary-foreground'>{t('historyResponse')}</p>
                        <TiptapRenderer content={attempt.response} />
                      </div>
                    ) : null}
                    {attempt.notes ? (
                      <div className='mt-2'>
                        <p className='m-0 mb-1 text-xs text-secondary-foreground'>{t('historyNotes')}</p>
                        <TiptapRenderer content={attempt.notes} />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {!data.isOwner ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-sm font-medium text-foreground'>{t('removeSectionTitle')}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>{t('removeSectionDescription')}</p>
              <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => setRemoveDialogOpen(true)} disabled={isRemoving}>
                {isRemoving ? tRepo('removing') : tRepo('removeFromRepository')}
              </button>
            </section>
          ) : null}
        </div>

        <ConfirmDialog
          open={removeDialogOpen}
          title={tRepo('removeConfirmTitle')}
          description={tRepo('removeConfirmDescription')}
          cancelLabel={tRepo('removeCancel')}
          confirmLabel={isRemoving ? tRepo('removing') : tRepo('removeFromRepository')}
          confirmVariant='destructive'
          isConfirming={isRemoving}
          onCancel={() => setRemoveDialogOpen(false)}
          onConfirm={removeQuestion}
        />
      </div>
    </AppShell>
  );
}
