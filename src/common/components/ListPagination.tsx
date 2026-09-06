'use client';

import { useTranslations } from 'next-intl';
import { lastPage } from '@/common/lib/pagination';
import { secondaryButtonClassName } from '@/common/styles/form';

type ListPaginationProps = {
  page: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export default function ListPagination({ page, totalCount, onPageChange }: ListPaginationProps) {
  const t = useTranslations('ListPagination');
  const totalPages = lastPage(totalCount);

  if (totalCount === 0 || totalPages <= 1) {
    return null;
  }

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
      <p className='m-0 text-xs text-muted-foreground'>{t('pageOf', { page, total: totalPages })}</p>
      <div className='flex gap-2'>
        <button type='button' className={secondaryButtonClassName} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          {t('previous')}
        </button>
        <button type='button' className={secondaryButtonClassName} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          {t('next')}
        </button>
      </div>
    </div>
  );
}
