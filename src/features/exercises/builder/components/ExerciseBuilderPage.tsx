'use client';

import type { SubmitEvent } from 'react';
import { useRef, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import BackLink from '@/common/components/BackLink';
import Field from '@/common/components/Field';
import PageLoadError from '@/common/components/PageLoadError';
import TopicsPickerField from '@/common/components/TopicsPickerField';
import TypeToConfirmDialog from '@/common/components/TypeToConfirmDialog';
import VisibilityField from '@/common/components/VisibilityField';
import { useValidationMessage } from '@/common/hooks/use-validation-message';
import { destructiveButtonClassName, inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import TiptapEditor, { type TiptapEditorRef } from '@/common/components/TiptapEditor';
import {
  exerciseBuilderFieldOrder,
  useExerciseBuilderForm,
  userExerciseApiLayer,
  type BuilderToastMessages,
  type ExerciseApiLayer,
} from '@/features/exercises/builder/hooks/useExerciseBuilderForm';
import ExerciseBuilderSkeleton from './ExerciseBuilderSkeleton';
import { scrollToFirstFormError } from '@/common/lib/scroll-to-first-form-error';
import { cn } from '@/lib/cn';

type ExerciseBuilderPageProps = {
  exerciseId?: string;
  apiLayer?: ExerciseApiLayer;
  backLink?: { href: string; label: string };
  cancelHref?: string;
  visibilityLabels?: { label: string; falseLabel: string; trueLabel: string };
  toastMessages?: BuilderToastMessages;
};

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
  correctChoiceLabel: string;
  removeChoiceLabel: string;
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
  correctChoiceLabel,
  removeChoiceLabel,
}: ChoiceRowProps) {
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
          {correctChoiceLabel}
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
          aria-label={removeChoiceLabel}>
          <Trash2 size={14} strokeWidth={1.75} aria-hidden='true' />
        </button>
      </div>
      {choiceErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{choiceErrorMessage}</span> : null}
    </div>
  );
}

export default function ExerciseBuilderPage({
  exerciseId,
  apiLayer = userExerciseApiLayer,
  backLink,
  cancelHref,
  visibilityLabels,
  toastMessages,
}: ExerciseBuilderPageProps) {
  const t = useTranslations('ExerciseBuilderPage');
  const formRef = useRef<HTMLFormElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const resolvedBackLink = backLink ?? { href: '/exercises', label: t('backToRepository') };
  const resolvedCancelHref = cancelHref ?? '/exercises';
  const resolvedVisibilityLabels = visibilityLabels ?? {
    label: t('visibilityLabel'),
    falseLabel: t('visibilityPrivate'),
    trueLabel: t('visibilityPublic'),
  };
  const resolvedToastMessages = toastMessages ?? {
    createSuccess: t('createSuccess'),
    updateSuccess: t('updateSuccess'),
    deleteSuccess: t('deleteSuccess'),
  };

  const {
    isEdit,
    values,
    fieldErrors,
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
    apiLayer,
    toastMessages: resolvedToastMessages,
  });

  const promptErrorMessage = useValidationMessage(fieldErrors.prompt);
  const explanationErrorMessage = useValidationMessage(fieldErrors.explanation);
  const choicesErrorMessage = useValidationMessage(fieldErrors.choices);

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
    return <PageLoadError title={isEdit ? t('editTitle') : t('createTitle')} message={t('loadError')} onRetry={refetch} retryLabel={t('retry')} />;
  }

  const canAddChoice = values.choices.length < maxChoices;
  const canRemoveChoice = values.choices.length > minChoices;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <BackLink href={resolvedBackLink.href} label={resolvedBackLink.label} />

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
                  correctChoiceLabel={t('correctChoice')}
                  removeChoiceLabel={t('removeChoice')}
                />
              ))}
            </div>

            {choicesErrorMessage ? <span className='mt-1.5 block text-xs text-destructive-bright'>{choicesErrorMessage}</span> : null}
          </div>

          <TopicsPickerField
            topics={metadata.topics}
            selectedIds={values.topicIds}
            onToggle={toggleTopic}
            error={fieldErrors.topicIds}
            labels={{
              fieldLabel: t('topicsLabel'),
              searchLabel: t('topicsSearchLabel'),
              searchPlaceholder: t('topicsSearchPlaceholder'),
              noTopicsMessage: t('noTopics'),
              noResultsMessage: t('topicsNoResults'),
            }}
          />

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

          <VisibilityField
            value={values.isPublic}
            onChange={(value) => setField('isPublic', value)}
            label={resolvedVisibilityLabels.label}
            falseLabel={resolvedVisibilityLabels.falseLabel}
            trueLabel={resolvedVisibilityLabels.trueLabel}
            radioName='visibility'
          />

          {isEdit ? (
            <section className='border-t border-border pt-6'>
              <h2 className='m-0 text-sm font-medium text-foreground'>{t('dangerZoneTitle')}</h2>
              <p className='mt-2 text-sm text-muted-foreground'>{t('deleteDescription')}</p>
              <button type='button' className={cn(destructiveButtonClassName, 'mt-4')} disabled={isDeleting} onClick={() => setDeleteDialogOpen(true)}>
                {isDeleting ? t('deleting') : t('deleteExercise')}
              </button>
            </section>
          ) : null}

          <div className='flex flex-col-reverse gap-2 border-t border-border pt-6 sm:flex-row sm:justify-end'>
            <Link href={resolvedCancelHref} className={cn(secondaryButtonClassName, 'text-center')}>
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
