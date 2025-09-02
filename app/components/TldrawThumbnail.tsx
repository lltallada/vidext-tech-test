'use client';

import React from 'react';
import { trpc } from '@/server/trpc/client';
import TldrawThumbnailDetail from '@/app/components/TldrawThumbnailDetail';

type Props = {
  id: string;
};

export default function TldrawThumbnail({ id }: Props) {
  const { data, isError, error } = trpc.design.get.useQuery(
    { id },
    { refetchOnWindowFocus: false, enabled: Boolean(id) }
  );

  if (isError) {
    console.error('Failed to fetch design', error);
  }

  const initialSnapshot =
    data?.found && 'snapshot' in data ? data.snapshot : null;

  return (
    <TldrawThumbnailDetail designId={id} initialSnapshot={initialSnapshot} />
  );
}
