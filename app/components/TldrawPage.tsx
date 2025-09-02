'use client';

import TldrawEditor from './draw/TldrawEditor';
import useTldrawEditor from '../hooks/useTldrawEditor';
import { SvgVidextLogo } from './icons/SvgVidextLogo';
import { unstable_ViewTransition as ViewTransition } from 'react';
import Link from 'next/link';

type Props = {
  designId: string;
  initialSnapshot: unknown | null;
};

export default function TldrawPage({ designId, initialSnapshot }: Props) {
  // moved editor logic to hook
  const { status, handleReady, isShapeSelected } = useTldrawEditor(
    designId,
    initialSnapshot
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* HEADER 75px */}
      <header
        style={{
          height: 75,
          background: '#f5f5f5',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0 1rem',
        }}
      >
        <Link href="/">go back</Link>
        <ViewTransition name="vidext-logo">
          <SvgVidextLogo width={213.5} height={50} />
        </ViewTransition>

        <strong>Editor: {designId}</strong>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {status === 'saving' && 'Desant…'}
          {status === 'saved' && 'Desat ✓'}
          {status === 'error' && 'Error'}
        </span>
        <span>Selected: {isShapeSelected ? 'yes' : 'no'}</span>
      </header>

      {/* CONTINGUT */}
      <main style={{ flex: 1, position: 'relative' }}>
        <TldrawEditor onEditorReady={handleReady} />
      </main>
    </div>
  );
}
