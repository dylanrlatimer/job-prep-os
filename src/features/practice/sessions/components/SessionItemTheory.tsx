'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { JSONContent } from '@tiptap/core';
import AttemptHistoryList from '@/common/components/AttemptHistoryList';
import AttemptTotals from '@/common/components/AttemptTotals';
import SourceCitation from '@/common/components/SourceCitation';
import TopicList from '@/common/components/TopicList';
import TiptapEditor, { type TiptapEditorRef } from '@/common/components/TiptapEditor';
import TiptapRenderer from '@/common/components/TiptapRenderer';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { invalidateQuestionCaches } from '@/features/theory/api/invalidate-question-caches';
import { resultLabelKey } from '@/features/theory/lib/attempt-result-styles';
import { answerSessionItemTheory } from '@/features/practice/sessions/api/mutations';
import { sessionItemReviewQueryOptions } from '@/features/practice/sessions/api/queries';
import type { AttemptResult, TheorySessionItem } from '@/features/practice/sessions/api/contracts';

type SessionItemTheoryProps = {
  item: TheorySessionItem;
  sessionId: string;
  onAnswered: (sessionComplete: boolean) => void;
  onSkip: () => void;
  isSkipping: boolean;
};

type Phase = 'draft' | 'grading';

export default function SessionItemTheory({ item, sessionId, onAnswered, onSkip, isSkipping }: SessionItemTheoryProps) {
  const t = useTranslations('SessionItemTheory');
  const queryClient = useQueryClient();
  const responseEditorRef = useRef<TiptapEditorRef>(null);
  const notesEditorRef = useRef<TiptapEditorRef>(null);

  const [phase, setPhase] = useState<Phase>('draft');
  const [lockedResponse, setLockedResponse] = useState<JSONContent | null>(null);
  const [result, setResult] = useState<AttemptResult | null>(null);

  const reviewQuery = useQuery(sessionItemReviewQueryOptions(sessionId, item.id));

  useEffect(() => {
    setPhase('draft');
    setLockedResponse(null);
    setResult(null);
  }, [item.id]);

  const handleReveal = async () => {
    const isEmpty = responseEditorRef.current?.isEmpty() ?? true;
    setLockedResponse(isEmpty ? null : (responseEditorRef.current?.getJSON() ?? null));
    await reviewQuery.refetch();
    setPhase('grading');
  };

  const { mutate: recordAttempt, isPending: isRecording } = useMutation({
    mutationFn: () => {
      const notesIsEmpty = notesEditorRef.current?.isEmpty() ?? true;
      return answerSessionItemTheory(sessionId, item.id, {
        result: result!,
        response: lockedResponse,
        notes: notesIsEmpty ? null : (notesEditorRef.current?.getJSON() ?? null),
      });
    },
    onSuccess: (response) => {
      void invalidateQuestionCaches(queryClient, item.content.id);
      onAnswered(response.sessionComplete);
    },
  });

  const isGrading = phase === 'grading' && reviewQuery.data;

  return (
    <div className='mx-auto mt-8 max-w-2xl'>
      <header className='border-b border-border pb-6'>
        <h1 className='m-0 text-lg font-medium leading-relaxed text-foreground'>{item.content.question}</h1>
        <div className='mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
          {item.content.topics.length > 0 ? (
            <TopicList className='text-secondary-foreground' topics={item.content.topics} />
          ) : (
            <span className='text-muted-foreground'>{t('noTopics')}</span>
          )}
          <SourceCitation name={item.content.sourceName} url={item.content.sourceUrl} />
          {isGrading ? (
            <AttemptTotals
              attempts={reviewQuery.data.attempts}
              incorrectLabel={t('attemptIncorrect', { count: reviewQuery.data.attempts.incorrect })}
              partialLabel={t('attemptPartial', { count: reviewQuery.data.attempts.partial })}
              correctLabel={t('attemptCorrect', { count: reviewQuery.data.attempts.correct })}
            />
          ) : null}
        </div>
      </header>

      <div className='mt-8 space-y-6'>
        <div>
          <label className='mb-1.5 block text-xs text-secondary-foreground' htmlFor='response'>
            {t('responseLabel')}
          </label>
          {isGrading ? (
            <div className='rounded-sm border border-border bg-muted px-3 py-2 text-sm'>
              {lockedResponse ? <TiptapRenderer content={lockedResponse} /> : <span className='text-muted-foreground'>{t('responseEmpty')}</span>}
            </div>
          ) : (
            <TiptapEditor key={item.id} ref={responseEditorRef} initialContent={null} id='response' />
          )}
        </div>

        {!isGrading ? (
          <div className='flex flex-wrap gap-2 pt-2'>
            <button type='button' className={primaryButtonClassName} onClick={() => void handleReveal()} disabled={reviewQuery.isFetching}>
              {reviewQuery.isFetching ? t('revealing') : t('revealAnswer')}
            </button>
            <button type='button' className={secondaryButtonClassName} onClick={onSkip} disabled={isSkipping}>
              {isSkipping ? t('skipping') : t('skip')}
            </button>
          </div>
        ) : (
          <div className='space-y-6'>
            <div className='rounded-sm border border-border bg-card px-4 py-3'>
              <p className='m-0 mb-2 text-xs text-secondary-foreground'>{t('referenceAnswerLabel')}</p>
              <TiptapRenderer content={reviewQuery.data.answer} />
            </div>

            <div>
              <p className='m-0 mb-1.5 text-xs text-secondary-foreground'>{t('resultLabel')}</p>
              <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
                {(['incorrect', 'partial', 'correct'] as const).map((option) => (
                  <label key={option} className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                    <input
                      type='radio'
                      name='result'
                      className='size-3.5 cursor-pointer accent-primary'
                      checked={result === option}
                      onChange={() => setResult(option)}
                    />
                    {t(resultLabelKey(option))}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className='mb-1.5 block text-xs text-secondary-foreground' htmlFor='notes'>
                {t('notesLabel')}
              </label>
              <TiptapEditor key={`${item.id}-notes`} ref={notesEditorRef} initialContent={null} id='notes' />
            </div>

            <div className='flex justify-end pt-2'>
              <button type='button' className={primaryButtonClassName} onClick={() => recordAttempt()} disabled={!result || isRecording}>
                {isRecording ? t('recording') : t('recordAndNext')}
              </button>
            </div>
          </div>
        )}
      </div>

      {isGrading ? (
        <section className='mt-10 border-t border-border pt-6'>
          <AttemptHistoryList
            title={t('historyTitle')}
            emptyLabel={t('historyEmpty')}
            items={reviewQuery.data.attemptHistory}
            resultLabel={(value) => t(resultLabelKey(value))}
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
      ) : null}
    </div>
  );
}
