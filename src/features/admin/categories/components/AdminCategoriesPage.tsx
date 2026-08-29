'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import AppShell from '@/common/components/AppShell';
import Select from '@/common/components/Select';
import AdminGate from '@/features/admin/components/AdminGate';
import { adminCategoriesQueryOptions } from '@/features/admin/categories/api/queries';
import type { AdminCategoryItem } from '@/features/admin/categories/api/contracts';
import { inputClassName, primaryButtonClassName, secondaryButtonClassName } from '@/common/styles/form';
import TheoryRepositorySkeleton from '@/features/theory/repository/components/TheoryRepositorySkeleton';
import { cn } from '@/lib/cn';

function matchesSearch(category: AdminCategoryItem, search: string) {
  if (!search) return true;
  const normalized = search.toLowerCase();
  return category.name.toLowerCase().includes(normalized) || category.slug.toLowerCase().includes(normalized);
}

function matchesStatus(category: AdminCategoryItem, status: 'all' | 'active' | 'disabled') {
  if (status === 'all') return true;
  if (status === 'active') return category.isActive;
  return !category.isActive;
}

export default function AdminCategoriesPage() {
  const t = useTranslations('AdminCategoriesPage');

  return (
    <AdminGate forbiddenMessage={t('forbidden')}>
      <AdminCategoriesContent />
    </AdminGate>
  );
}

function AdminCategoriesContent() {
  const t = useTranslations('AdminCategoriesPage');
  const { data, isPending, isError, refetch, isFetching } = useQuery(adminCategoriesQueryOptions);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'disabled'>('all');

  const filteredCategories = useMemo(() => {
    if (!data) return [];
    return data.categories.filter((category) => matchesSearch(category, search) && matchesStatus(category, status));
  }, [data, search, status]);

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('allStatuses') },
      { value: 'active', label: t('active') },
      { value: 'disabled', label: t('disabled') },
    ],
    [t],
  );

  if (!data && isPending) {
    return (
      <AppShell>
        <TheoryRepositorySkeleton />
      </AppShell>
    );
  }

  if (isError || !data) {
    return (
      <AppShell>
        <div className='px-4 py-8 md:px-8'>
          <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
          <p className='mt-2 text-sm text-muted-foreground'>{t('loadError')}</p>
          <button type='button' className={cn(secondaryButtonClassName, 'mt-4')} onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t('retrying') : t('retry')}
          </button>
        </div>
      </AppShell>
    );
  }

  const isEmpty = data.categories.length === 0;
  const hasNoMatches = !isEmpty && filteredCategories.length === 0;

  return (
    <AppShell>
      <div className='px-4 py-8 md:px-8'>
        <header className='border-b border-border pb-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <h1 className='m-0 text-lg font-medium text-foreground'>{t('title')}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{t('description')}</p>
            </div>

            <Link href='/admin/topics/new' className={cn(primaryButtonClassName, 'shrink-0 self-start')}>
              {t('createCategory')}
            </Link>
          </div>
        </header>

        {!isEmpty && (
          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <label className='block flex-1'>
              <span className='sr-only'>{t('searchLabel')}</span>
              <input
                className={inputClassName}
                type='search'
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t('searchPlaceholder')}
              />
            </label>

            <Select
              className='w-full sm:w-44'
              aria-label={t('statusFilterLabel')}
              value={status}
              onValueChange={(value) => setStatus(value as 'all' | 'active' | 'disabled')}
              options={statusOptions}
            />
          </div>
        )}

        <p className='mt-4 border-b border-border pb-4 text-xs text-muted-foreground'>
          {isEmpty ? t('categoryCountEmpty') : t('categoryCount', { count: data.categories.length })}
        </p>

        {isEmpty ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('emptyTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('emptyDescription')}</p>
            <Link href='/admin/topics/new' className={cn(primaryButtonClassName, 'mt-4 inline-flex')}>
              {t('createCategory')}
            </Link>
          </div>
        ) : hasNoMatches ? (
          <div className='py-12'>
            <p className='m-0 text-sm text-foreground'>{t('noMatchesTitle')}</p>
            <p className='mt-1 text-sm text-muted-foreground'>{t('noMatchesDescription')}</p>
          </div>
        ) : (
          <ul className='m-0 list-none p-0'>
            {filteredCategories.map((category) => (
              <li key={category.id} className='border-b border-border py-4 last:border-b-0'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                  <div className='min-w-0 flex-1'>
                    <p className='m-0 text-sm leading-relaxed text-foreground'>{category.name}</p>
                    <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
                      <span className={category.isActive ? 'text-success' : 'text-muted-foreground'}>{category.isActive ? t('active') : t('disabled')}</span>
                      <span className='text-muted-foreground'>{category.slug}</span>
                      <span className='text-muted-foreground'>{t('questionCount', { count: category.questionCount })}</span>
                    </div>
                  </div>

                  <Link href={`/admin/topics/${category.id}/edit`} className={cn(secondaryButtonClassName, 'shrink-0 self-start sm:ml-4')}>
                    {t('edit')}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
