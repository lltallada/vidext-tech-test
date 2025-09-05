'use client';

import { Box, TldrawImage } from '@tldraw/tldraw';
import { trpc } from '@/server/trpc/client';
import '@tldraw/tldraw/tldraw.css';
import { LoaderCircle } from 'lucide-react';
import { useMemo } from 'react';

export default function DrawThumbnail({ id }: { id: string }) {
  const { data, isLoading, isError, error } = trpc.design.get.useQuery(
    { id: id },
    {
      refetchOnWindowFocus: false,
    }
  );

  const initialSnapshot: unknown =
    data?.found && 'snapshot' in data ? data.snapshot : null;

  const { viewportPageBounds, canRender } = useMemo(() => {
    if (!initialSnapshot || !(initialSnapshot as any).document) {
      return { viewportPageBounds: new Box(0, 0, 300, 300), canRender: false };
    }

    const store: Record<string, unknown> =
      (initialSnapshot as any).document.store || {};
    const shapes = Object.values(store).filter(
      s => (s as any)?.typeName === 'shape'
    );

    if (shapes.length === 0) {
      return { viewportPageBounds: new Box(0, 0, 300, 300), canRender: false };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const push = (x: number, y: number) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    };

    for (const s of shapes) {
      const sx = typeof (s as any).x === 'number' ? (s as any).x : 0;
      const sy = typeof (s as any).y === 'number' ? (s as any).y : 0;

      if (
        typeof (s as any).x === 'number' &&
        typeof (s as any).y === 'number'
      ) {
        const w =
          (s as any).w ??
          (s as any).width ??
          (s as any).props?.w ??
          (s as any).props?.width ??
          0;
        const h =
          (s as any).h ??
          (s as any).height ??
          (s as any).props?.h ??
          (s as any).props?.height ??
          0;
        push(sx, sy);
        push(sx + w, sy + h);
      }

      if (Array.isArray((s as any).points)) {
        for (const p of (s as any).points) {
          if (p && typeof p.x === 'number' && typeof p.y === 'number')
            push(p.x, p.y);
        }
      }

      if (Array.isArray((s as any).props?.points)) {
        for (const p of (s as any).props.points) {
          if (p && typeof p.x === 'number' && typeof p.y === 'number')
            push(sx + p.x, sy + p.y);
        }
      }

      if (Array.isArray((s as any).props?.segments)) {
        for (const seg of (s as any).props.segments) {
          const pts = seg?.points || [];
          for (const p of pts) {
            if (p && typeof p.x === 'number' && typeof p.y === 'number')
              push(sx + p.x, sy + p.y);
          }
        }
      }
    }

    if (
      !isFinite(minX) ||
      !isFinite(minY) ||
      !isFinite(maxX) ||
      !isFinite(maxY)
    ) {
      return { viewportPageBounds: new Box(0, 0, 300, 300), canRender: false };
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    // Make square while keeping the current center (centering preserved)
    const side = Math.max(width, height);
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const squareMinX = centerX - side / 2;
    const squareMinY = centerY - side / 2;

    return {
      viewportPageBounds: new Box(squareMinX, squareMinY, side, side),
      canRender: true,
    };
  }, [initialSnapshot]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!initialSnapshot || !canRender) {
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
