'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import AppShell from '@/common/components/AppShell';
import AttemptHistoryList from '@/common/components/AttemptHistoryList';
import AttemptTotals from '@/common/components/AttemptTotals';
import BackLink from '@/common/components/BackLink';
import PageLoadError from '@/common/components/PageLoadError';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { applyExerciseAttemptToCaches, invalidateExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { submitExerciseAnswer } from '@/features/exercises/practice/api/mutations';
import { exercisePracticeQueryOptions } from '@/features/exercises/practice/api/queries';
import type { SubmitExerciseAnswerResponse } from '@/features/exercises/practice/api/contracts';
import { attemptResultClassName, resultLabelKey } from '@/features/theory/lib/attempt-result-styles';
import ExercisePracticeSkeleton from './ExercisePracticeSkeleton';
import { cn } from '@/lib/cn';

type ExercisePracticePageProps = {
  exerciseId: string;
};

type SessionPhase = 'draft' | 'result';

function choiceResultClassName({
  choiceId,
  selectedChoiceIds,
  correctChoiceIds,
}: {
  choiceId: string;
  selectedChoiceIds: string[];
  correctChoiceIds: string[];
}) {
  const isCorrect = correctChoiceIds.includes(choiceId);
  const isSelected = selectedChoiceIds.includes(choiceId);

  if (isCorrect) {
    return 'border-success bg-success/10';
  }

  if (isSelected) {
    return 'border-destructive-bright bg-destructive-bright/10';
  }

  return 'border-border bg-card';
}

export default function ExercisePracticePage({ exerciseId }: ExercisePracticePageProps) {
  const t = useTranslations('ExercisePracticePage');
  const queryClient = useQueryClient();

  const { data, isPending, isError, refetch, isFetching } = useQuery(exercisePracticeQueryOptions(exerciseId));

  const [phase, setPhase] = useState<SessionPhase>('draft');
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitExerciseAnswerResponse | null>(null);

  const { mutate: submitAnswer, isPending: isSubmitting } = useMutation({
    mutationFn: () => submitExerciseAnswer(exerciseId, { selectedChoiceIds }),
    onSuccess: async (response) => {
      setSubmitResult(response);
      setPhase('result');
      applyExerciseAttemptToCaches(queryClient, exerciseId, {
        id: response.attemptId,
        result: response.result,
        selectedChoiceIds,
      });
      await invalidateExerciseCaches(queryClient, exerciseId);
    },
  });

  const toggleChoice = (choiceId: string) => {
    if (!data) {
      return;
    }

    if (data.allowMultiple) {
      setSelectedChoiceIds((current) => (current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId]));
      return;
    }

    setSelectedChoiceIds([choiceId]);
  };

  const handleTryAgain = () => {
    setPhase('draft');
    setSelectedChoiceIds([]);
    setSubmitResult(null);
  };

  if (isPending) {
    return (
      <AppShell>
        <ExercisePracticeSkeleton />
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

  const isResult = phase === 'result' && submitResult !== null;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href='/exercises' label={t('backToRepository')} />

        <header className='mt-4 border-b border-border pb-6'>
          <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{data.title}</h1>

          <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            {data.topics.length > 0 ? (
              <TopicList className='text-secondary-foreground' topics={data.topics} />
            ) : (
              <span className='text-muted-foreground'>{t('noTopics')}</span>
            )}

            <SourceCitation name={data.sourceName} url={data.sourceUrl} />

            <AttemptTotals
              attempts={data.attempts}
              incorrectLabel={t('attemptIncorrect', { count: data.attempts.incorrect })}
              partialLabel={t('attemptPartial', { count: data.attempts.partial })}
              correctLabel={t('attemptCorrect', { count: data.attempts.correct })}
            />
          </div>
        </header>

        <div className='mx-auto mt-8 max-w-2xl space-y-6'>
          <div>
            <TiptapRenderer content={data.prompt} />
          </div>

          <fieldset className='m-0 mb-6 border-0 p-0'>
            <legend className='mb-3 block text-xs text-secondary-foreground'>{t('choicesLabel')}</legend>

            <div className='space-y-3'>
              {data.choices.map((choice) => {
                const inputType = data.allowMultiple ? 'checkbox' : 'radio';
                const isChecked = selectedChoiceIds.includes(choice.id);

                return (
                  <label
                    key={choice.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-3 text-sm transition-colors',
                      isResult
                        ? choiceResultClassName({
                            choiceId: choice.id,
                            selectedChoiceIds,
                            correctChoiceIds: submitResult.correctChoiceIds,
                          })
                        : isChecked
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/40',
                    )}>
                    {!isResult ? (
                      <input
                        type={inputType}
                        name='choice'
                        className='mt-1 size-3.5 shrink-0 cursor-pointer accent-primary'
                        checked={isChecked}
                        onChange={() => toggleChoice(choice.id)}
                      />
                    ) : null}
                    <div className='min-w-0 flex-1'>
                      <TiptapRenderer content={choice.content} />
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {!isResult ? (
            <button type='button' className={primaryButtonClassName} onClick={() => submitAnswer()} disabled={selectedChoiceIds.length === 0 || isSubmitting}>
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
          ) : (
            <div className='flex flex-col gap-6'>
              <p className='m-0 text-sm'>
                <span className='text-secondary-foreground'>{t('resultLabel')}</span>
                <span className='text-muted-foreground'> · </span>
                <span className={attemptResultClassName(submitResult.result)}>{t(resultLabelKey(submitResult.result))}</span>
              </p>

              {submitResult.explanation ? (
                <div className='rounded-sm border border-border bg-card px-4 py-3'>
                  <p className='m-0 mb-2 text-xs text-secondary-foreground'>{t('explanationLabel')}</p>
                  <TiptapRenderer content={submitResult.explanation} />
                </div>
              ) : null}

              <button type='button' className={cn(secondaryButtonClassName, 'self-start')} onClick={handleTryAgain}>
                {t('tryAgain')}
              </button>
            </div>
          )}
        </div>

        {isResult ? (
          <section className='mx-auto mt-10 max-w-2xl border-t border-border pt-6'>
            <AttemptHistoryList
              title={t('historyTitle')}
              emptyLabel={t('historyEmpty')}
              items={data.attemptHistory}
              resultLabel={(result) => t(resultLabelKey(result))}
            />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
