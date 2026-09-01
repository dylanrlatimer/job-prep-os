'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/query-client';
import ToastContainer from '@/common/components/ToastContainer';
import UnsavedChangesProvider from '@/common/unsaved-changes/UnsavedChangesProvider';
import AuthModalProvider from '@/features/auth/components/AuthModalProvider';
import AuthSyncBridge from '@/features/auth/components/AuthSyncBridge';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <UnsavedChangesProvider>
        <AuthModalProvider>
          <AuthSyncBridge />
          {children}
          <ToastContainer />
        </AuthModalProvider>
      </UnsavedChangesProvider>
    </QueryClientProvider>
  );
}
