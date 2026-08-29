'use client';

import { useEffect, useId, useRef } from 'react';
import { primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import { cn } from '@/lib/cn';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmVariant?: 'primary' | 'destructive';
  isConfirming?: boolean;
};

const destructiveButtonClassName =
  'inline-flex cursor-pointer items-center justify-center rounded-sm border border-destructive-border bg-destructive-subtle px-3 py-2 text-sm text-destructive-bright transition-colors hover:bg-destructive-subtle/80 disabled:cursor-not-allowed disabled:opacity-60';

export default function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  confirmVariant = 'primary',
  isConfirming = false,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

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
        <div className='mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
          <button
            ref={cancelButtonRef}
            type='button'
            className={cn(primaryButtonClassName, 'w-full sm:w-auto')}
            onClick={onCancel}
            disabled={isConfirming}>
            {cancelLabel}
          </button>
          <button
            type='button'
            className={cn(confirmVariant === 'destructive' ? destructiveButtonClassName : secondaryButtonClassName, 'w-full sm:w-auto')}
            onClick={onConfirm}
            disabled={isConfirming}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
