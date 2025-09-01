import Link from 'next/link'
import { getBaseUrl } from '@/app/lib/getBaseUrl'

export const revalidate = 0
export const dynamic = 'force-dynamic'

type Row = { id: string; updatedAt: number; size: number }

export default async function DesignsPage() {
  const base = await getBaseUrl()
  const url = `${base}/api/trpc/design.list`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch design list')

  const payload = await res.json()
  const rows: Row[] = payload?.result?.data ?? []

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
                <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                  <Link href={`/draw/${encodeURIComponent(r.id)}`}>Obrir</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
