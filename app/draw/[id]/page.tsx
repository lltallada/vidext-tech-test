import TldrawPage from '@/app/components/TldrawPage';
import { getBaseUrl } from '@/app/lib/getBaseUrl';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

type Params = { id: string };

export default async function Page(props: { params: Promise<Params> }) {
  const { id } = await props.params;
  const base = await getBaseUrl();
  const input = encodeURIComponent(JSON.stringify({ id }));
  const url = `${base}/api/trpc/design.get?input=${input}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch design');

  const payload = await res.json();
  const data = payload?.result?.data as
    | { found: true; snapshot: unknown; updatedAt: number }
    | { found: false };

  const initialSnapshot = data?.found ? data.snapshot : null;

  return <TldrawPage designId={id} initialSnapshot={initialSnapshot} />;
}
