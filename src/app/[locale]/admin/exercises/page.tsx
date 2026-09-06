import { Suspense } from 'react';
import AppShell from '@/common/components/AppShell';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import AdminExercisesPage from '@/features/admin/exercises/components/AdminExercisesPage';

export default function AdminExercisesPageEntry() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <ListPageSkeleton />
        </AppShell>
      }>
      <AdminExercisesPage />
    </Suspense>
  );
}
