import { Suspense } from 'react';
import AppShell from '@/common/components/AppShell';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import AdminQuestionsPage from '@/features/admin/questions/components/AdminQuestionsPage';

export default function AdminQuestionsPageEntry() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <ListPageSkeleton />
        </AppShell>
      }>
      <AdminQuestionsPage />
    </Suspense>
  );
}
