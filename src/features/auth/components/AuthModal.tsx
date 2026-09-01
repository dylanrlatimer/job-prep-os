'use client';

import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { invalidateBrowseCaches } from '@/features/admin/api/invalidate-admin-caches';
import { invalidateExerciseBrowseCaches } from '@/features/exercises/api/invalidate-caches';
import type { AuthModalNext } from '@/features/auth/auth-modal-context';
import { cn } from '@/lib/cn';
import AuthForm from './AuthForm';
import styles from './AuthModal.module.css';

type AuthModalProps = {
  open: boolean;
  next: AuthModalNext | null;
  onClose: () => void;
};

export default function AuthModal({ open, next, onClose }: AuthModalProps) {
  const t = useTranslations('AuthPage');
  const queryClient = useQueryClient();
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  const handleSuccess = async () => {
    await Promise.all([invalidateBrowseCaches(queryClient), invalidateExerciseBrowseCaches(queryClient)]);
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4' role='presentation'>
      <button type='button' className={cn(styles.backdrop, 'absolute inset-0 bg-canvas/80')} aria-label={t('close')} onClick={onClose} />
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        className={cn(styles.dialog, 'relative w-full max-w-sm rounded-sm border border-border bg-card p-5 shadow-none')}>
        <button
          type='button'
          className='absolute top-5 right-5 inline-flex size-7 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-muted-foreground transition-colors hover:bg-card-muted hover:text-foreground'
          aria-label={t('close')}
          onClick={onClose}>
          <X size={16} strokeWidth={1.75} aria-hidden='true' />
        </button>
        <AuthForm headingId={titleId} headingLevel='h2' headingClassName='pr-8' redirectTo={next} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
