'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import TldrawPage from '@/app/components/draw/TldrawPage';

type QueryData =
  | { found: true; snapshot: unknown; updatedAt: number }
  | { found: false };

export default function DesignLoader({
  designId,
  initialData,
}: {
  designId: string;
  initialData: QueryData;
}) {
  const input = encodeURIComponent(JSON.stringify({ id: designId }));
  const fetcher = async (): Promise<QueryData> => {
    const res = await fetch(`/api/trpc/design.get?input=${input}`);
    if (!res.ok) throw new Error('Failed to fetch design');
    const payload = await res.json();
    return payload?.result?.data as QueryData;
  };

  const { data } = useQuery(['design', designId], fetcher, {
    initialData,
    // adjust options as needed
    staleTime: 0,
  });

  const initialSnapshot = data?.found ? data.snapshot : null;

  return <TldrawPage designId={designId} initialSnapshot={initialSnapshot} />;
}
