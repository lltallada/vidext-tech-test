'use client'

import Link from 'next/link'
import { useState } from 'react'
import { trpc } from '@/server/trpc/client'

type Row = { id: string; updatedAt: number; size: number }

export default function DrawsListing({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initialRows)
  const del = trpc.design.delete.useMutation()

  const handleDelete = async (id: string) => {
    const confirm = window.confirm(`Segur que vols esborrar "${id}"?`)
    if (!confirm) return
    // Optimistic UI
    const prev = rows
    setRows((r) => r.filter((x) => x.id !== id))
    try {
      const res = await del.mutateAsync({ id })
      if (!res.ok) {
        setRows(prev) // revertir si no existeix
        alert('No s’ha pogut esborrar (no trobat).')
      }
    } catch (e) {
      setRows(prev) // revertir si error xarxa
      alert('Error en esborrar.')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 16 }}>Dissenys en memòria</h1>

      {rows.length === 0 ? (
        <p>No hi ha dissenys guardats.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>ID</th>
              <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' }}>Darrera actualització</th>
              <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px' }}>Mida (bytes)</th>
              <th style={{ borderBottom: '1px solid #ddd', padding: '8px' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <code>{r.id}</code>
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  {new Date(r.updatedAt).toLocaleString()}
                </td>
                <td style={{ padding: '8px', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                  {r.size.toLocaleString()}
                </td>
                <td style={{ padding: '8px', borderBottom: '1px solid #eee', whiteSpace: 'nowrap' }}>
                  <Link href={`/draw/${encodeURIComponent(r.id)}`} style={{ marginRight: 8 }}>
                    Obrir
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id)}
                    style={{ padding: '6px 10px', border: '1px solid #d33', borderRadius: 6, color: '#d33' }}
                  >
                    Esborra
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
