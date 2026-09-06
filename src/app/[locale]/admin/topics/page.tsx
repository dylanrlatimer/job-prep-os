import { Suspense } from 'react';
import AppShell from '@/common/components/AppShell';
import ListPageSkeleton from '@/common/components/ListPageSkeleton';
import AdminTopicsPage from '@/features/admin/topics/components/AdminTopicsPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <ListPageSkeleton />
        </AppShell>
      }>
      <AdminTopicsPage />
    </Suspense>
  );
}
