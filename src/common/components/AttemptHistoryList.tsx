'use client';

import type { ReactNode } from 'react';
import { useLocale } from 'next-intl';
import { attemptResultClassName, type AttemptResult } from '@/features/theory/lib/attempt-result-styles';

export type AttemptHistoryItem = {
  id: string;
  createdAt: string;
  result: AttemptResult;
};

type AttemptHistoryListProps<T extends AttemptHistoryItem> = {
  title: string;
  emptyLabel: string;
  items: T[];
  resultLabel: (result: AttemptResult) => string;
  renderDetails?: (item: T) => ReactNode;
};

export default function AttemptHistoryList<T extends AttemptHistoryItem>({ title, emptyLabel, items, resultLabel, renderDetails }: AttemptHistoryListProps<T>) {
  const locale = useLocale();

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  return (
    <>
      <h2 className='m-0 text-sm font-medium text-foreground'>{title}</h2>

      {items.length === 0 ? (
        <p className='mt-3 text-sm text-muted-foreground'>{emptyLabel}</p>
      ) : (
        <ul className='m-0 mt-4 list-none p-0'>
          {items.map((item, index) => (
            <li key={item.id} className={index > 0 ? 'mt-4 border-t border-border pt-4' : undefined}>
              <p className='m-0 text-sm'>
                <span className='text-muted-foreground'>{formatDate(item.createdAt)}</span>
                <span className='text-muted-foreground'> · </span>
                <span className={attemptResultClassName(item.result)}>{resultLabel(item.result)}</span>
              </p>
              {renderDetails?.(item)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
