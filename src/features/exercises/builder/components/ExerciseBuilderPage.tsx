'use client';

import type { SubmitEvent, ReactNode } from 'react';
import { useMemo, useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import Fuse from 'fuse.js';
import { ChevronLeft, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import TopicIcon from '@/common/components/TopicIcon';
import TypeToConfirmDialog from '@/common/components/TypeToConfirmDialog';
import { useValidationMessage } from '@/common/hooks/use-validation-message';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import TiptapEditor, { type TiptapEditorRef } from '@/common/components/TiptapEditor';
import { exerciseBuilderFieldOrder, useExerciseBuilderForm } from '@/features/exercises/builder/hooks/useExerciseBuilderForm';
import type { BuilderTopic } from '@/features/exercises/builder/api/contracts';
import ExerciseBuilderSkeleton from './ExerciseBuilderSkeleton';
import { scrollToFirstFormError } from '@/common/lib/scroll-to-first-form-error';
import { useFormGuard } from '@/common/form/use-form-guard';
import { cn } from '@/lib/cn';

type ExerciseBuilderPageProps = {
  exerciseId?: string;
};

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
};

function Field({ label, htmlFor, error, children }: FieldProps) {
  const errorMessage = useValidationMessage(error);

  return (
    <div data-field={htmlFor}>
      <label className='block' htmlFor={htmlFor}>
        <span className='mb-1.5 block text-xs text-secondary-foreground'>{label}</span>
        {children}
        {errorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{errorMessage}</span> : null}
      </label>
    </div>
  );
}

function useFilteredTopics(topics: BuilderTopic[], query: string) {
  const fuse = useMemo(
    () =>
      new Fuse(topics, {
        keys: ['name', 'slug'],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [topics],
  );

  return useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return topics;
    return fuse.search(trimmed).map((result) => result.item);
  }, [fuse, query, topics]);
}

function getChoiceFieldError(fieldErrors: Record<string, string>, index: number) {
  return fieldErrors[`choices.${index}.content`] ?? fieldErrors[`choices.${index}`];
}

type ChoiceRowProps = {
  choiceId: string;
  index: number;
  isCorrect: boolean;
  initialContent: JSONContent | null;
  status: 'loading' | 'ready' | 'submitting';
  canRemove: boolean;
  fieldError?: string;
  setChoiceEditorRef: (choiceId: string) => (instance: TiptapEditorRef | null) => void;
  onChoiceReady: (choiceId: string) => (document: JSONContent) => void;
  onDocumentUpdate: () => void;
  setChoiceCorrect: (choiceId: string, isCorrect: boolean) => void;
  removeChoice: (choiceId: string) => void;
  exerciseId?: string;
};

function ChoiceRow({
  choiceId,
  index,
  isCorrect,
  initialContent,
  status,
  canRemove,
  fieldError,
  setChoiceEditorRef,
  onChoiceReady,
  onDocumentUpdate,
  setChoiceCorrect,
  removeChoice,
  exerciseId,
}: ChoiceRowProps) {
  const t = useTranslations('ExerciseBuilderPage');
  const choiceErrorMessage = useValidationMessage(fieldError);

  return (
    <div data-field={`choices.${index}`}>
      <div className='flex items-center'>
        <label className='mr-3 flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-foreground whitespace-nowrap'>
          <input
            type='checkbox'
            className='size-3.5 cursor-pointer accent-primary'
            checked={isCorrect}
            onChange={(event) => setChoiceCorrect(choiceId, event.target.checked)}
          />
          {t('correctChoice')}
        </label>
        <div className='min-w-0 flex-1'>
          <TiptapEditor
            key={`${choiceId}-${exerciseId ?? 'new'}`}
            ref={setChoiceEditorRef(choiceId)}
            id={`choice-${choiceId}`}
            variant='inline'
            initialContent={initialContent}
            onEditorReady={onChoiceReady(choiceId)}
            onUpdate={onDocumentUpdate}
            disabled={status !== 'ready'}
          />
        </div>
        <button
          type='button'
          className='ml-3 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-sm py-1 text-muted-foreground transition-colors hover:bg-card-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'
          disabled={!canRemove || status !== 'ready'}
          onClick={() => removeChoice(choiceId)}
          aria-label={t('removeChoice')}>
          <Trash2 size={14} strokeWidth={1.75} aria-hidden='true' />
        </button>
      </div>
      {choiceErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{choiceErrorMessage}</span> : null}
    </div>
  );
}

export default function ExerciseBuilderPage({ exerciseId }: ExerciseBuilderPageProps) {
  const t = useTranslations('ExerciseBuilderPage');
  const formRef = useRef<HTMLFormElement>(null);
  const [topicSearch, setTopicSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const {
    isEdit,
    values,
    fieldErrors,
    isDirty,
    status,
    initialPrompt,
    initialExplanation,
    promptRef,
    explanationRef,
    metadata,
    isLoading,
    isError,
    isFormDataReady,
    isSubmitting,
    isDeleting,
    submit,
    setField,
    toggleTopic,
    setChoiceCorrect,
    addChoice,
    removeChoice,
    onPromptReady,
    onExplanationReady,
    onChoiceReady,
    onDocumentUpdate,
    setChoiceEditorRef,
    getInitialChoiceContent,
    remove,
    refetch,
    minChoices,
    maxChoices,
  } = useExerciseBuilderForm({
    exerciseId,
  });

  useFormGuard(status, isDirty, isError);

  const promptErrorMessage = useValidationMessage(fieldErrors.prompt);
  const explanationErrorMessage = useValidationMessage(fieldErrors.explanation);
  const choicesErrorMessage = useValidationMessage(fieldErrors.choices);
  const topicsErrorMessage = useValidationMessage(fieldErrors.topicIds);
  const filteredTopics = useFilteredTopics(metadata?.topics ?? [], topicSearch);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = submit();

    if (!result.ok) {
      scrollToFirstFormError(result.fieldErrors, exerciseBuilderFieldOrder, formRef.current ?? document);
    }
  };

  if (isLoading || !isFormDataReady) {
    return (
      <AppShell>
        <ExerciseBuilderSkeleton />
      </AppShell>
    );
  }

  if (isError || !metadata) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={refetch}>
            {t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  const hasTopics = metadata.topics.length > 0;
  const canAddChoice = values.choices.length < maxChoices;
  const canRemoveChoice = values.choices.length > minChoices;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <Link href='/exercises' className='inline-flex items-center gap-1 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground'>
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden='true' />
          {t('backToRepository')}
        </Link>

        <header className='mt-4 border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0 flex-1'>
              <h1 className='m-0 text-lg font-medium text-foreground'>{isEdit ? t('editTitle') : t('createTitle')}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{isEdit ? t('editDescription') : t('createDescription')}</p>
            </div>

            {isEdit ? (
              <button
                type='submit'
                form='exercise-builder-form'
                className={cn(primaryButtonClassName, 'shrink-0')}
                disabled={isSubmitting || status !== 'ready'}>
                {isSubmitting ? t('saving') : t('saveChanges')}
              </button>
            ) : null}
          </div>
        </header>

        <form id='exercise-builder-form' ref={formRef} onSubmit={handleSubmit} noValidate className='mx-auto mt-8 max-w-2xl space-y-6'>
          <Field label={t('titleLabel')} htmlFor='title' error={fieldErrors.title}>
            <input
              id='title'
              className={inputClassName}
              type='text'
              value={values.title}
              onChange={(event) => setField('title', event.target.value)}
              placeholder={t('titlePlaceholder')}
              maxLength={200}
            />
          </Field>

          <div data-field='prompt'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('questionLabel')}</span>
            <TiptapEditor
              key={exerciseId ? `prompt-${exerciseId}` : 'prompt-new'}
              ref={promptRef}
              id='prompt'
              initialContent={initialPrompt}
              onEditorReady={onPromptReady}
              onUpdate={onDocumentUpdate}
              disabled={status !== 'ready'}
            />
            {promptErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{promptErrorMessage}</span> : null}
          </div>

          <div data-field='explanation'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('explanationLabel')}</span>
            <TiptapEditor
              key={exerciseId ? `explanation-${exerciseId}` : 'explanation-new'}
              ref={explanationRef}
              id='explanation'
              initialContent={initialExplanation}
              onEditorReady={onExplanationReady}
              onUpdate={onDocumentUpdate}
              disabled={status !== 'ready'}
            />
            {explanationErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{explanationErrorMessage}</span> : null}
          </div>

          <div data-field='choices'>
            <div className='mb-4 flex items-center justify-between gap-3'>
              <span className='text-xs text-secondary-foreground'>{t('choicesLabel')}</span>
              <button
                type='button'
                className={cn(secondaryButtonClassName, 'inline-flex items-center gap-1 px-2 py-1 text-xs')}
                disabled={!canAddChoice || status !== 'ready'}
                onClick={addChoice}>
                <Plus size={14} strokeWidth={1.75} aria-hidden='true' />
                {t('addChoice')}
              </button>
            </div>

            <div className='space-y-2'>
              {values.choices.map((choice, index) => (
                <ChoiceRow
                  key={choice.id}
                  choiceId={choice.id}
                  index={index}
                  isCorrect={choice.isCorrect}
                  initialContent={getInitialChoiceContent(choice.id, index)}
                  status={status}
                  canRemove={canRemoveChoice}
                  fieldError={getChoiceFieldError(fieldErrors, index)}
                  setChoiceEditorRef={setChoiceEditorRef}
                  onChoiceReady={onChoiceReady}
                  onDocumentUpdate={onDocumentUpdate}
                  setChoiceCorrect={setChoiceCorrect}
                  removeChoice={removeChoice}
                  exerciseId={exerciseId}
                />
              ))}
            </div>

            {choicesErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{choicesErrorMessage}</span> : null}
          </div>

          <div data-field='topicIds'>
            <span className='mb-1.5 block text-xs text-secondary-foreground'>{t('topicsLabel')}</span>

            {!hasTopics ? (
              <p className='m-0 text-sm text-muted-foreground'>{t('noTopics')}</p>
            ) : (
              <div className='overflow-hidden rounded-sm border border-border bg-card'>
                <div className='border-b border-border px-3 py-2'>
                  <label className='relative block'>
                    <span className='sr-only'>{t('topicsSearchLabel')}</span>
                    <Search
                      size={14}
                      strokeWidth={1.75}
                      className='pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-muted-foreground'
                      aria-hidden='true'
                    />
                    <input
                      type='search'
                      className='w-full border-0 bg-transparent py-1 pr-1 pl-5 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none'
                      value={topicSearch}
                      onChange={(event) => setTopicSearch(event.target.value)}
                      placeholder={t('topicsSearchPlaceholder')}
                    />
                  </label>
                </div>
                <div className='scrollbar-branded h-48 overflow-y-auto'>
                  {filteredTopics.length === 0 ? (
                    <p className='m-0 px-3 py-4 text-sm text-muted-foreground'>{t('topicsNoResults')}</p>
                  ) : (
                    <ul className='m-0 list-none p-0'>
                      {filteredTopics.map((topic, index) => {
                        const checked = values.topicIds.includes(topic.id);
                        const inputId = `topic-${topic.id}`;

                        return (
                          <li key={topic.id} className={cn(index > 0 && 'border-t border-border')}>
                            <label htmlFor={inputId} className='flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-card-muted'>
                              <input
                                id={inputId}
                                type='checkbox'
                                className='size-3.5 shrink-0 cursor-pointer accent-primary'
                                checked={checked}
                                onChange={() => toggleTopic(topic.id)}
                              />
                              <span className='inline-flex items-center gap-1.5 text-foreground'>
                                <TopicIcon iconKey={topic.iconKey} />
                                <span className='-translate-y-px'>{topic.name}</span>
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {topicsErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{topicsErrorMessage}</span> : null}
          </div>

          <Field label={t('sourceNameLabel')} htmlFor='sourceName' error={fieldErrors.sourceName}>
            <input
              id='sourceName'
              className={inputClassName}
              type='text'
              value={values.sourceName}
              onChange={(event) => setField('sourceName', event.target.value)}
              placeholder={t('sourceNamePlaceholder')}
              maxLength={200}
            />
          </Field>

          <Field label={t('sourceUrlLabel')} htmlFor='sourceUrl' error={fieldErrors.sourceUrl}>
            <input
              id='sourceUrl'
              className={inputClassName}
              type='url'
              value={values.sourceUrl}
              onChange={(event) => setField('sourceUrl', event.target.value)}
              placeholder={t('sourceUrlPlaceholder')}
              inputMode='url'
            />
          </Field>

          <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
            <input
              type='checkbox'
              className='size-3.5 cursor-pointer accent-primary'
              checked={values.allowMultiple}
              onChange={(event) => setField('allowMultiple', event.target.checked)}
            />
            {t('allowMultipleLabel')}
          </label>

          <fieldset className='m-0 mb-6 border-0 p-0'>
            <legend className='mb-1.5 block text-xs text-secondary-foreground'>{t('visibilityLabel')}</legend>
            <div className='flex flex-col gap-2 sm:flex-row sm:gap-6'>
              <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='radio'
                  name='visibility'
                  className='size-3.5 cursor-pointer accent-primary'
                  checked={!values.isPublic}
                  onChange={() => setField('isPublic', false)}
                />
                {t('visibilityPrivate')}
              </label>
              <label className='flex cursor-pointer items-center gap-2 text-sm text-foreground'>
                <input
                  type='radio'
                  name='visibility'
                  className='size-3.5 cursor-pointer accent-primary'
                  checked={values.isPublic}
                  onChange={() => setField('isPublic', true)}
                />
                {t('visibilityPublic')}
              </label>
            </div>
          </fieldset>

          {isEdit ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-sm font-medium text-foreground'>{t('dangerZoneTitle')}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>{t('deleteDescription')}</p>
              <button
                type='button'
                className={cn(
                  'mt-4 inline-flex cursor-pointer items-center justify-center rounded-sm border border-destructive-border bg-destructive-subtle px-3 py-2 text-sm text-destructive-bright transition-colors hover:bg-destructive-subtle/80 disabled:cursor-not-allowed disabled:opacity-60',
                )}
                disabled={isDeleting}
                onClick={() => setDeleteDialogOpen(true)}>
                {isDeleting ? t('deleting') : t('deleteExercise')}
              </button>
            </section>
          ) : null}

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href='/exercises' className={cn(secondaryButtonClassName, 'text-center')}>
              {t('cancel')}
            </Link>
            <button type='submit' className={primaryButtonClassName} disabled={isSubmitting || status !== 'ready'}>
              {isSubmitting ? t('saving') : isEdit ? t('saveChanges') : t('createExercise')}
            </button>
          </div>
        </form>

        <TypeToConfirmDialog
          open={deleteDialogOpen}
          title={t('deleteConfirmTitle')}
          description={t('deleteConfirmDescription')}
          inputLabel={t('deleteConfirmTypeLabel', { word: t('deleteConfirmWord') })}
          confirmWord={t('deleteConfirmWord')}
          cancelLabel={t('cancel')}
          confirmLabel={isDeleting ? t('deleting') : t('deleteExercise')}
          isConfirming={isDeleting}
          onCancel={() => setDeleteDialogOpen(false)}
          onConfirm={remove}
        />
      </div>
    </AppShell>
  );
}
