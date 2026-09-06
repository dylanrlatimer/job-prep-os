import type { ReactNode } from 'react';

type ListRowProps = {
  title: ReactNode;
  meta: ReactNode;
  actions: ReactNode;
  children?: ReactNode;
};

export default function ListRow({ title, meta, actions, children }: ListRowProps) {
  return (
    <li className='border-b border-border py-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='min-w-0 flex-1'>
          <div className='text-sm leading-relaxed'>{title}</div>
          <div className='mt-2 flex flex-wrap items-center gap-x-3 gap-y-1'>{meta}</div>
        </div>
        <div className='flex shrink-0 flex-wrap gap-2 self-start sm:ml-4 sm:self-auto'>{actions}</div>
      </div>
      {children}
    </li>
  );
}
