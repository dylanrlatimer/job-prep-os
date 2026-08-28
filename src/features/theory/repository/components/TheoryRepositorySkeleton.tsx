export default function TheoryRepositorySkeleton() {
  return (
    <div className='px-4 py-8 md:px-8'>
      <div className='h-6 w-48 animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-2 h-4 w-72 max-w-full animate-pulse rounded-sm bg-card-muted' />

      <div className='mt-8 flex flex-col gap-3 sm:flex-row'>
        <div className='h-9 flex-1 animate-pulse rounded-sm bg-card-muted' />
        <div className='h-9 w-full animate-pulse rounded-sm bg-card-muted sm:w-44' />
      </div>

      <div className='mt-6 border-t border-border'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className='border-b border-border py-4'>
            <div className='h-4 w-full max-w-lg animate-pulse rounded-sm bg-card-muted' />
            <div className='mt-2 h-3 w-32 animate-pulse rounded-sm bg-card-muted' />
          </div>
        ))}
      </div>
    </div>
  );
}
