import { getBaseUrl } from '@/app/lib/getBaseUrl'
import DrawsListing from '@/app/components/DrawsListing'

export const revalidate = 0
export const dynamic = 'force-dynamic'

type Row = { id: string; updatedAt: number; size: number }

export default async function DesignsPage() {
  const base = await getBaseUrl()
  const res = await fetch(`${base}/api/trpc/design.list`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to fetch design list')

  const payload = await res.json()
  const rows: Row[] = payload?.result?.data ?? []

  return <DrawsListing initialRows={rows} />
}
