'use client'

import { useRef, useState } from 'react'
import TldrawEditor from './TldrawEditor'
import { trpc } from '@/server/trpc/client'
import type { Editor } from '@tldraw/tldraw'

type Props = {
  designId: string
  initialSnapshot: unknown | null
}

export default function TldrawPage({ designId, initialSnapshot }: Props) {
  const [status, setStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle')
  const editorRef = useRef<Editor | null>(null)

  const saveMutation = trpc.design.save.useMutation()

  const handleReady = (editor: Editor) => {
    editorRef.current = editor
    if (initialSnapshot) {
      // tldraw accepta el snapshot JSON serialitzable
      // @ts-expect-error tipus interns de tldraw
      editor.store.loadSnapshot(initialSnapshot)
    }
  }

  const handleSave = async () => {
    const editor = editorRef.current
    if (!editor) return
    try {
      setStatus('saving')
      const snapshot = editor.store.getSnapshot()
      await saveMutation.mutateAsync({ id: designId, snapshot })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 800)
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

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
        <strong>Editor: {designId}</strong>
        <button onClick={handleSave} style={{ padding: '6px 10px', border: '1px solid #ccc', borderRadius: 6 }}>
          Desa
        </button>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          {status === 'saving' && 'Desant…'}
          {status === 'saved' && 'Desat ✓'}
          {status === 'error' && 'Error'}
        </span>
      </header>

      {/* CONTINGUT */}
      <main style={{ flex: 1, position: 'relative' }}>
        <TldrawEditor onEditorReady={handleReady} />
      </main>
    </div>
  )
}
