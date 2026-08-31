'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import AttemptHistoryList from '@/common/components/AttemptHistoryList';
import AttemptTotals from '@/common/components/AttemptTotals';
import BackLink from '@/common/components/BackLink';
import ConfirmDialog from '@/common/components/ConfirmDialog';
import PageLoadError from '@/common/components/PageLoadError';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import { invalidateRepositoryCaches } from '@/features/theory/api/invalidate-repository-caches';
import { questionDetailQueryOptions } from '@/features/theory/detail/api/queries';
import { unsaveRepositoryQuestion } from '@/features/theory/repository/api/mutations';
import { resultLabelKey } from '@/features/theory/lib/attempt-result-styles';
import QuestionDetailSkeleton from './QuestionDetailSkeleton';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { useToastStore } from '@/lib/store/use-toast-store';
import { cn } from '@/lib/cn';

type QuestionDetailPageProps = {
  questionId: string;
};

export default function QuestionDetailPage({ questionId }: QuestionDetailPageProps) {
  const t = useTranslations('QuestionDetailPage');
  const tRepo = useTranslations('TheoryRepositoryPage');
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

  if (isPending) {
    return (
      <AppShell>
        <QuestionDetailSkeleton />
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

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/' label={t('backToRepository')} />

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.question}</h1>

              <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                {data.topics.length > 0 ? (
                  <TopicList className='text-secondary-foreground' topics={data.topics} />
                ) : (
                  <span className='text-muted-foreground'>{t('noTopics')}</span>
                )}

                <SourceCitation name={data.sourceName} url={data.sourceUrl} />

                <span className='text-muted-foreground'>{data.isPublic ? t('visibilityPublic') : t('visibilityPrivate')}</span>

                <AttemptTotals
                  attempts={data.attempts}
                  incorrectLabel={t('attemptIncorrect', { count: data.attempts.incorrect })}
                  partialLabel={t('attemptPartial', { count: data.attempts.partial })}
                  correctLabel={t('attemptCorrect', { count: data.attempts.correct })}
                  emptyLabel={t('noAttempts')}
                />
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
            <AttemptHistoryList
              title={t('historyTitle')}
              emptyLabel={t('historyEmpty')}
              items={data.attemptHistory}
              resultLabel={(result) => t(resultLabelKey(result))}
              renderDetails={(attempt) => (
                <>
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
                </>
              )}
            />
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
