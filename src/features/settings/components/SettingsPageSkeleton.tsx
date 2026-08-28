import { cn } from '@/lib/cn';

const fieldGhostClassName = 'h-8.5 w-full';

function Ghost({ className }: { className?: string }) {
  return <div className={cn('rounded-sm bg-card-muted', className)} aria-hidden='true' />;
}

export default function SettingsPageSkeleton() {
  return (
    <div className='mx-auto w-full max-w-sm animate-pulse px-4 py-8'>
      <Ghost className='h-5 w-24' />

      <div className='mt-6 space-y-4'>
        <div>
          <Ghost className='mb-1.5 h-3 w-20' />
          <Ghost className={fieldGhostClassName} />
        </div>
        <div>
          <Ghost className='mb-1.5 h-3 w-12' />
          <Ghost className={fieldGhostClassName} />
        </div>
        <Ghost className={fieldGhostClassName} />
      </div>

      <div className='mt-8 border-t border-border pt-6'>
        <Ghost className={fieldGhostClassName} />
      </div>
    </div>
  );
}
