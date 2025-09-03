'use client';

import { trpc } from '@/server/trpc/client';
import { useParams } from 'next/navigation';
import TldrawPage from '@/app/components/draw/TldrawPage';
import { LoaderCircle } from 'lucide-react';

export default function Page() {
  const { id } = useParams();

  const designId = Array.isArray(id) ? id[0] : id;

  if (!designId) return <p>Missing id</p>;

  const { data, isLoading, isError, error } = trpc.design.get.useQuery(
    { id: designId },
    {
      refetchOnWindowFocus: false,
    }
  );

  const initialSnapshot =
    data?.found && 'snapshot' in data ? data.snapshot : null;

  if (isLoading)
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );

  if (isError) return <p>Error: {String(error?.message ?? error)}</p>;

  return <TldrawPage designId={designId} initialSnapshot={initialSnapshot} />;
}
