'use client';

import Link from 'next/link';
import React, { memo, useState } from 'react';
import { trpc } from '@/server/trpc/client';
import TldrawThumbnail from '../TldrawThumbnail';

export type Row = { id: string; updatedAt: number; size: number };

function DrawListingItem({
  row,
  children,
}: {
  row: Row;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const del = trpc.design.delete.useMutation();

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm(`Segur que vols esborrar "${id}"?`);
    if (!confirmDelete) return;

    // Optimistic UI: hide immediately
    setVisible(false);
    try {
      const res = await del.mutateAsync({ id });
      if (!res.ok) {
        setVisible(true); // revert if not found
        alert('No s’ha pogut esborrar (no trobat).');
      }
    } catch (e) {
      setVisible(true); // revert on network/error
      alert('Error en esborrar.');
    }
  };

  if (!visible) return null;

  return (
    <li
      style={{
        display: 'flex',
        gap: 12,
        padding: 12,
        borderBottom: '1px solid #eee',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          minWidth: 220,
        }}
      >
        {/* render thumbnail inside client component */}
        {children}
      </div>

      <div style={{ flex: 1, color: '#555' }}>
        {new Date(row.updatedAt).toLocaleString()}
      </div>

      <div style={{ width: 140, textAlign: 'right' }}>
        {row.size.toLocaleString()}
      </div>

      <div style={{ width: 140, marginLeft: 12, whiteSpace: 'nowrap' }}>
        <Link
          href={`/draw/${encodeURIComponent(row.id)}`}
          style={{ marginRight: 8 }}
        >
          Obrir
        </Link>
        <button
          onClick={() => handleDelete(row.id)}
          style={{
            padding: '6px 10px',
            border: '1px solid #d33',
            borderRadius: 6,
            color: '#d33',
            background: 'transparent',
          }}
        >
          Esborra
        </button>
      </div>
    </li>
  );
}

export const MemoDrawListingItem = memo(DrawListingItem);
export default MemoDrawListingItem;
