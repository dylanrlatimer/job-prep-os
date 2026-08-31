'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidateExerciseCaches } from '@/features/exercises/api/invalidate-caches';
import { attemptResultClassName, resultLabelKey } from '@/features/theory/lib/attempt-result-styles';
import { answerSessionItemExercise } from '@/features/practice/sessions/api/mutations';
import { sessionNextQueryOptions } from '@/features/practice/sessions/api/queries';
import type { AnswerExerciseItemResponse, ExerciseSessionItem } from '@/features/practice/sessions/api/contracts';
import { cn } from '@/lib/cn';

type SessionItemExerciseProps = {
  item: ExerciseSessionItem;
  sessionId: string;
  onAnswered: (sessionComplete: boolean) => void;
  onSkip: () => void;
  isSkipping: boolean;
};

type Phase = 'draft' | 'result';

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

export default function SessionItemExercise({ item, sessionId, onAnswered, onSkip, isSkipping }: SessionItemExerciseProps) {
  const t = useTranslations('SessionItemExercise');
  const queryClient = useQueryClient();

  const [phase, setPhase] = useState<Phase>('draft');
  const [selectedChoiceIds, setSelectedChoiceIds] = useState<string[]>([]);
  const [submitResult, setSubmitResult] = useState<AnswerExerciseItemResponse | null>(null);

  useEffect(() => {
    setPhase('draft');
    setSelectedChoiceIds([]);
    setSubmitResult(null);
  }, [item.id]);

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: () => answerSessionItemExercise(sessionId, item.id, { selectedChoiceIds }),
    onSuccess: (response) => {
      setSubmitResult(response);
      setPhase('result');
      void invalidateExerciseCaches(queryClient, item.content.id);
      void queryClient.prefetchQuery(sessionNextQueryOptions(sessionId));
    },
  });

  const toggleChoice = (choiceId: string) => {
    if (item.content.allowMultiple) {
      setSelectedChoiceIds((current) => (current.includes(choiceId) ? current.filter((id) => id !== choiceId) : [...current, choiceId]));
      return;
    }

    setSelectedChoiceIds([choiceId]);
  };

  const isResult = phase === 'result' && submitResult !== null;

  return (
    <div className='mx-auto mt-8 max-w-2xl'>
      <header className='border-b border-border pb-6'>
        <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{item.content.title}</h1>
        <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
          {item.content.topics.length > 0 ? (
            <TopicList className='text-secondary-foreground' topics={item.content.topics} />
          ) : (
            <span className='text-muted-foreground'>{t('noTopics')}</span>
          )}
          <SourceCitation name={item.content.sourceName} url={item.content.sourceUrl} />
        </div>
      </header>

      <div className='mt-8 space-y-6'>
        <TiptapRenderer content={item.content.prompt} />

        <fieldset className='m-0 mb-6 border-0 p-0'>
          <legend className='mb-3 block text-xs text-secondary-foreground'>{t('choicesLabel')}</legend>
          <div className='space-y-3'>
            {item.content.choices.map((choice) => {
              const inputType = item.content.allowMultiple ? 'checkbox' : 'radio';
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
          <div className='flex flex-wrap gap-2'>
            <button type='button' className={primaryButtonClassName} onClick={() => submit()} disabled={selectedChoiceIds.length === 0 || isSubmitting}>
              {isSubmitting ? t('submitting') : t('submit')}
            </button>
            <button type='button' className={secondaryButtonClassName} onClick={onSkip} disabled={isSkipping}>
              {isSkipping ? t('skipping') : t('skip')}
            </button>
          </div>
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

            <button type='button' className={cn(primaryButtonClassName, 'self-start')} onClick={() => onAnswered(submitResult.sessionComplete)}>
              {t('nextItem')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
