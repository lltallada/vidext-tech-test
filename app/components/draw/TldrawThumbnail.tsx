'use client';

import { Box, TldrawImage } from 'tldraw';
import { trpc } from '@/server/trpc/client';
import 'tldraw/tldraw.css';
import { LoaderCircle } from 'lucide-react';
import { useMemo } from 'react';

export default function TldrawImageExample({ id }: { id: string }) {
  const { data, isLoading, isError, error } = trpc.design.get.useQuery(
    { id: id },
    {
      refetchOnWindowFocus: false,
    }
  );

  const initialSnapshot: any =
    data?.found && 'snapshot' in data ? data.snapshot : null;

  const viewportPageBounds = useMemo(() => {
    if (!initialSnapshot || !initialSnapshot.document) {
      return new Box(0, 0, 300, 300);
    }

    const store: Record<string, any> = initialSnapshot.document.store || {};
    const shapes = Object.values(store).filter(s => s?.typeName === 'shape');

    if (shapes.length === 0) {
      return new Box(0, 0, 300, 300);
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
      const sx = typeof s.x === 'number' ? s.x : 0;
      const sy = typeof s.y === 'number' ? s.y : 0;

      if (typeof s.x === 'number' && typeof s.y === 'number') {
        const w = s.w ?? s.width ?? s.props?.w ?? s.props?.width ?? 0;
        const h = s.h ?? s.height ?? s.props?.h ?? s.props?.height ?? 0;
        push(sx, sy);
        push(sx + w, sy + h);
      }

      if (Array.isArray(s.points)) {
        for (const p of s.points) {
          if (p && typeof p.x === 'number' && typeof p.y === 'number')
            push(p.x, p.y);
        }
      }

      if (Array.isArray(s.props?.points)) {
        for (const p of s.props.points) {
          if (p && typeof p.x === 'number' && typeof p.y === 'number')
            push(sx + p.x, sy + p.y);
        }
      }

      if (Array.isArray(s.props?.segments)) {
        for (const seg of s.props.segments) {
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
      return new Box(0, 0, 300, 300);
    }

    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);

    // Make square while keeping the current center (centering preserved)
    const side = Math.max(width, height);
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;
    const squareMinX = centerX - side / 2;
    const squareMinY = centerY - side / 2;

    return new Box(squareMinX, squareMinY, side, side);
  }, [initialSnapshot]);

  return (
    <>
      {initialSnapshot ? (
        <TldrawImage
          snapshot={initialSnapshot}
          bounds={viewportPageBounds}
          background={false}
          padding={100}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <LoaderCircle className="animate-spin" />
        </div>
      )}
    </>
  );
}
