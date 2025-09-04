'use client';

import React from 'react';
import DrawsListingItem from './DrawListingItem';
import { trpc } from '@/server/trpc/client';
import { LoaderCircle } from 'lucide-react';
import NewDrawDialog from './NewDrawDialog';

type Row = { id: string; updatedAt: number; size: number };

export default function DrawsListing() {
  const {
    data = [],
    isLoading,
    isError,
    error,
  } = trpc.design.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : isError ? (
        <p style={{ color: 'red' }}>
          Error: {error?.message ?? 'Failed to load'}
        </p>
      ) : data.length === 0 ? (
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center p-4">
          <h3 className="text-2xl text-gray-700 text-center">
            Oops! Nothing to see here… time to get creative!
          </h3>
          <NewDrawDialog buttonText="Let's draw!" />
        </div>
      ) : (
        <>
          <h1 className="text-2xl mb-4">Your Drawings</h1>
          <ul className="grid gap-6 md:gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            {data.map((r: Row) => (
              <DrawsListingItem key={r.id} row={r} />
            ))}
          </ul>
        </>
      )}
    </>
  );
}
