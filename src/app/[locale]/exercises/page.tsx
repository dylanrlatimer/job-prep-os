import { Suspense } from 'react';
import AppShell from '@/common/components/AppShell';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import ExerciseRepositoryPage from '@/features/exercises/repository/components/ExerciseRepositoryPage';

export default function ExercisesPageEntry() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <ListPageSkeleton />
        </AppShell>
      }>
      <ExerciseRepositoryPage />
    </Suspense>
  );
}
