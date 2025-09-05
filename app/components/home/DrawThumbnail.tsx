'use client';

import { TldrawImage } from '@tldraw/tldraw';
import { trpc } from '@/server/trpc/client';
import '@tldraw/tldraw/tldraw.css';
import { LoaderCircle } from 'lucide-react';
import { useMemo } from 'react';
import { computeViewportFromSnapshot } from './computeViewport';

export default function DrawThumbnail({ id }: { id: string }) {
  const { data, isLoading, isError } = trpc.design.get.useQuery(
    { id: id },
    {
      refetchOnWindowFocus: false,
    }
  );

  const initialSnapshot: unknown =
    data?.found && 'snapshot' in data ? data.snapshot : null;

  const { viewportPageBounds, canRender } = useMemo(
    () => computeViewportFromSnapshot(initialSnapshot),
    [initialSnapshot]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!initialSnapshot || !canRender || isError) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400">
        No preview available
      </div>
    );
  }

  return (
    <TldrawImage
      snapshot={initialSnapshot as any}
      bounds={viewportPageBounds}
      background={false}
      padding={100}
    />
  );
}
