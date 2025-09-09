'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Persister } from '@tanstack/react-query-persist-client';

import { trpc } from '@/server/trpc/client';
import { httpBatchLink } from '@trpc/client';
import { ReactNode, useMemo, useState } from 'react';

const PERSIST_KEY = 'rq-cache';
const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

const noopPersister: Persister = {
  persistClient: async () => {},
  restoreClient: async () => undefined,
  removeClient: async () => {},
};

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            gcTime: MAX_AGE,
          },
        },
      })
  );

  const persister = useMemo<Persister>(() => {
    if (typeof window === 'undefined') return noopPersister;
    return createSyncStoragePersister({
      storage: window.localStorage,
      key: PERSIST_KEY,
      throttleTime: 0,
    });
  }, []);

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [httpBatchLink({ url: '/api/trpc' })],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: MAX_AGE }}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  );
}
