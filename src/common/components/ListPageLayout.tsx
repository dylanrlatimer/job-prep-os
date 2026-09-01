import type { ReactNode } from 'react';

type ListPageLayoutProps = {
  title: string;
  description: string;
  headerActions?: ReactNode;
  filters?: ReactNode;
  countLabel?: string;
  countExtra?: ReactNode;
  children: ReactNode;
};

export default function ListPageLayout({ title, description, headerActions, filters, countLabel, countExtra, children }: ListPageLayoutProps) {
  return (
    <div className='px-4 py-8 md:px-8'>
      <header className='border-b border-border pb-6'>
        {headerActions ? (
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='min-w-0'>
              <h1 className='m-0 text-lg font-medium text-foreground'>{title}</h1>
              <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{description}</p>
            </div>
            {headerActions}
          </div>
        ) : (
          <>
            <h1 className='m-0 text-lg font-medium text-foreground'>{title}</h1>
            <p className='mt-1 max-w-2xl text-sm text-muted-foreground'>{description}</p>
          </>
        )}
      </header>

      {filters}

      {countLabel || countExtra ? (
        countExtra ? (
          <div className='mt-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between'>
            {countLabel ? <p className='m-0 text-xs text-muted-foreground'>{countLabel}</p> : null}
            {countExtra}
          </div>
        ) : (
          <p className='mt-4 border-b border-border pb-4 text-xs text-muted-foreground'>{countLabel}</p>
        )
      ) : null}

      {children}
    </div>
  );
}

type ListEmptyStateProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function ListEmptyState({ title, description, children }: ListEmptyStateProps) {
  return (
    <div className='py-12'>
      <p className='m-0 text-sm text-foreground'>{title}</p>
      <p className='mt-1 text-sm text-muted-foreground'>{description}</p>
      {children}
    </div>
  );
}
