'use client';

import React from 'react';
import Link from 'next/link';
import { trpc } from '@/server/trpc/client';
import DrawsListing from '@/app/components/draw/DrawsListing';
import Header from '@/app/components/ui/Header';

type Row = { id: string; updatedAt: number; size: number };

export default function DesignsPage() {
  const { data, isLoading, isError, error } = trpc.design.list.useQuery(
    undefined,
    {
      refetchOnWindowFocus: false,
    }
  );

  const rows: Row[] = data ?? [];

  return (
    <main>
      <Header />

      <section>
        <Link href="/draw/test">Go to editor</Link>

        {isLoading ? (
          <p>Loading…</p>
        ) : isError ? (
          <p style={{ color: 'red' }}>
            Error: {(error as any)?.message ?? 'Failed to load'}
          </p>
        ) : (
          <DrawsListing initialRows={rows} />
        )}
      </section>
    </main>
  );
}
