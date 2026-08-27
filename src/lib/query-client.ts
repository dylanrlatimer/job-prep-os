import { MutationCache, QueryClient, type QueryClientConfig } from '@tanstack/react-query';
import { cache } from 'react';
import { ApiClientError } from '@/lib/errors/api-client-error';
import { resolveApiErrorToastKey } from '@/lib/resolve-api-error-message';
import { useToastStore } from '@/lib/store/use-toast-store';

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
};

// One instance per server request (React cache deduplicates across parallel RSCs).
export const getServerQueryClient = cache(() => new QueryClient(config));

// Called once on the client
export const makeQueryClient = () =>
  new QueryClient({
    ...config,
    mutationCache: new MutationCache({
      onError: (error) => {
        if (error instanceof ApiClientError) {
          useToastStore.getState().addToast({ errorCode: resolveApiErrorToastKey(error) }, 'error');
        } else {
          useToastStore.getState().addToast({ errorCode: 'fallback' }, 'error');
        }
      },
    }),
  });
