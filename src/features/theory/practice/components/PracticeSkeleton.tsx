export default function PracticeSkeleton() {
  return (
    <div className='px-4 py-8 md:px-8'>
      <div className='h-4 w-32 animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-6 h-6 w-full max-w-xl animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-3 h-4 w-56 animate-pulse rounded-sm bg-card-muted' />

      <div className='mt-8 space-y-6'>
        <div>
          <div className='mb-2 h-3 w-24 animate-pulse rounded-sm bg-card-muted' />
          <div className='h-32 animate-pulse rounded-sm bg-card-muted' />
        </div>
        <div className='h-9 w-44 animate-pulse rounded-sm bg-card-muted' />
      </div>
    </div>
  );
}
