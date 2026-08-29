export default function ExerciseBuilderSkeleton() {
  return (
    <div className='px-4 py-8 md:px-8'>
      <div className='h-4 w-28 animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-4 h-6 w-48 animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-2 h-4 w-80 max-w-full animate-pulse rounded-sm bg-card-muted' />

      <div className='mt-8 space-y-6'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className='mb-2 h-3 w-24 animate-pulse rounded-sm bg-card-muted' />
            <div className='h-24 animate-pulse rounded-sm bg-card-muted' />
          </div>
        ))}
      </div>
    </div>
  );
}
