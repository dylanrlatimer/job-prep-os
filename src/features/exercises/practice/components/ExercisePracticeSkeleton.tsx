export default function ExercisePracticeSkeleton() {
  return (
    <div className='px-4 py-8 md:px-8'>
      <div className='h-4 w-32 animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-6 h-24 w-full max-w-xl animate-pulse rounded-sm bg-card-muted' />
      <div className='mt-3 h-4 w-56 animate-pulse rounded-sm bg-card-muted' />

      <div className='mt-8 space-y-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className='h-12 animate-pulse rounded-sm bg-card-muted' />
        ))}
        <div className='h-9 w-44 animate-pulse rounded-sm bg-card-muted' />
      </div>
    </div>
  );
}
