'use client';

import Link from 'next/link';
import React, { memo, useMemo } from 'react';
import DeleteDrawDialog from './DeleteDrawDialog';
import TldrawImageExample from '@/app/components/home/TldrawThumbnail';
import '@tldraw/tldraw/tldraw.css';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';

export type Row = { id: string; updatedAt: number; size: number };

function DrawListingItem({ row }: { row: Row }) {
  const displayId = useMemo(() => {
    try {
      return decodeURIComponent(row.id);
    } catch {
      return row.id;
    }
  }, [row.id]);

  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <li className="bg-white group aspect-square rounded-2xl border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 relative overflow-hidden">
      <div className="absolute inset-0 group-hover:blur-[3px] transition-">
        <TldrawImageExample id={row.id} />
      </div>
      <div
        className={`bg-black/10 py-2 px-3 absolute bottom-0 left-0 right-0 flex items-center justify-between
        ${
          !isMobile &&
          ' group-hover:translate-y-0 translate-y-full transition-transform'
        }
      `}
      >
        <div>
          <p className="font-bold">{displayId}</p>
          <p className="text-sm text-gray-700">
            {new Date(row.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/draw/${row.id}`}
            className="flex w-full h-full flex-col relative"
          >
            <Button variant="secondary" size="icon" type="button">
              <Pencil size={18} />
            </Button>
          </Link>
          <DeleteDrawDialog id={row.id} onClose={() => {}} />
        </div>
      </div>
    </li>
  );
}

export const MemoDrawListingItem = memo(DrawListingItem);

export default MemoDrawListingItem;
