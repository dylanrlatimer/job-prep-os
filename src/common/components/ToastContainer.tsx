'use client';

import { useTranslations } from 'next-intl';
import { useToastStore, type Toast } from '@/lib/store/use-toast-store';
import styles from './ToastContainer.module.css';

function getToastMessage(toast: Toast, t: ReturnType<typeof useTranslations<'Errors'>>): string {
  if (toast.errorCode) {
    if (t.has(toast.errorCode)) return t(toast.errorCode);
    return t('fallback');
  }
  return toast.message ?? '';
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const tErrors = useTranslations('Errors');
  const tCommon = useTranslations('Common');

  if (toasts.length === 0) return null;

  return (
    <div className={styles.wrapper} role='region' aria-label={tCommon('notifications')} aria-live='polite'>
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <span className={styles.message}>{getToastMessage(toast, tErrors)}</span>
        </div>
      ))}
    </div>
  );
}
