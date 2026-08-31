'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { destructiveButtonClassName, inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type TypeToConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  inputLabel: string;
  confirmWord: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
};

export default function TypeToConfirmDialog({
  open,
  title,
  description,
  inputLabel,
  confirmWord,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  isConfirming = false,
}: TypeToConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [value, setValue] = useState('');

  const canConfirm = value === confirmWord && !isConfirming;

  useEffect(() => {
    if (!open) {
      setValue('');
      return;
    }

    cancelButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4' role='presentation'>
      <button type='button' className='absolute inset-0 bg-canvas/80' aria-label={cancelLabel} onClick={onCancel} disabled={isConfirming} />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className='relative w-full max-w-sm rounded-sm border border-border bg-card p-5 shadow-none'>
        <h2 id={titleId} className='m-0 text-sm font-medium text-foreground'>
          {title}
        </h2>
        <p id={descriptionId} className='mt-2 text-sm text-muted-foreground'>
          {description}
        </p>

        <label className='mt-4 block' htmlFor={inputId}>
          <span className='mb-1.5 block text-xs text-secondary-foreground'>{inputLabel}</span>
          <input
            id={inputId}
            className={inputClassName}
            type='text'
            value={value}
            onChange={(event) => setValue(event.target.value)}
            autoComplete='off'
            autoCorrect='off'
            autoCapitalize='off'
            spellCheck={false}
            disabled={isConfirming}
          />
        </label>

        <div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <button ref={cancelButtonRef} type='button' className={cn(primaryButtonClassName, 'w-full sm:w-auto')} onClick={onCancel} disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button type='button' className={cn(destructiveButtonClassName, 'w-full sm:w-auto')} onClick={onConfirm} disabled={!canConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
