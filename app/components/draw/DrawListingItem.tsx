'use client';

import Link from 'next/link';
import React, { memo } from 'react';
import DeleteDrawDialog from './DeleteDrawDialog';
import TldrawImageExample from '@/app/components/draw/TldrawThumbnail';
import 'tldraw/tldraw.css';

export type Row = { id: string; updatedAt: number; size: number };

function DrawListingItem({ row }: { row: Row }) {
  return (
    <li className="bg-white group aspect-square rounded-2xl border border-gray-300 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 cursor-pointer relative overflow-hidden">
      <div className="absolute inset-0">
        <TldrawImageExample id={row.id} />
      </div>
      <Link
        href={`/draw/${encodeURIComponent(row.id)}`}
        className="flex w-full h-full flex-col relative"
      />
      <div className="bg-black/70 text-white p-4 absolute bottom-0 left-0 right-0 group-hover:translate-y-0 translate-y-full transition-transform flex items-center justify-between">
        <div>
          <p className="font-bold">{row.id}</p>
          <p className="text-sm text-gray-300">
            {new Date(row.updatedAt).toLocaleString()}
          </p>
        </div>

        <DeleteDrawDialog
          id={row.id}
          buttonText="Delete"
          buttonVariant="danger"
        />
      </div>
    </li>
  );
}

export const MemoDrawListingItem = memo(DrawListingItem);

export default MemoDrawListingItem;
