'use client';

import Link from 'next/link';
import React, { memo } from 'react';
import DeleteDrawDialog from './DeleteDrawDialog';
import TldrawImageExample from '@/app/components/draw/TldrawThumbnail';
import 'tldraw/tldraw.css';
import { Pencil } from 'lucide-react';
import { Button } from '../ui/button';

export type Row = { id: string; updatedAt: number; size: number };

function DrawListingItem({ row }: { row: Row }) {
  return (
    <li className="bg-white group aspect-square rounded-2xl border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 relative overflow-hidden">
      <div className="absolute inset-0 group-hover:blur-[3px] transition-">
        <TldrawImageExample id={row.id} />
      </div>
      <div className="bg-black/10 py-2 px-3 absolute bottom-0 left-0 right-0 group-hover:translate-y-0 translate-y-full transition-transform flex items-center justify-between">
        <div>
          <p className="font-bold">{row.id}</p>
          <p className="text-sm text-gray-700">
            {new Date(row.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/draw/${encodeURIComponent(row.id)}`}
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
