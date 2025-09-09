'use client';

import React from 'react';
import DrawsListingItem from './DrawListingItem';
import { trpc } from '@/server/trpc/client';
import { LoaderCircle } from 'lucide-react';
import NewDrawDialog from './NewDrawDialog';

type Row = { id: string; updatedAt: number; size: number };

export default function DrawsListing() {
  const {
    data, // <-- no default here
    isError,
    error,
    isPending, // v5: true while no data and query is pending (including initial)
    fetchStatus, // 'paused' during persisted-cache restore
  } = trpc.design.list.useQuery(undefined, {
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    // optional: shows previous data instantly on remounts
    // placeholderData: (prev) => prev,
  });

  // While waiting for initial fetch OR waiting for persisted cache to restore,
  // show a loader instead of the empty state.
  if (isPending || fetchStatus === 'paused') {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <p style={{ color: 'red' }}>
        Error: {error?.message ?? 'Failed to load'}
      </p>
    );
  }

  const items = data ?? [];

  if (items.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center p-4">
        <h3 className="text-2xl text-gray-700 text-center">
          Oops! Nothing to see here... time to get creative!
        </h3>
        <NewDrawDialog buttonText="Let's draw!" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl mb-4">Your Drawings</h1>
      <ul className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {items.map((r: Row) => (
          <DrawsListingItem key={r.id} row={r} />
        ))}
      </ul>
    </>
  );
}
