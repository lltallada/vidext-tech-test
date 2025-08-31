'use client'

import { useEffect, useRef, useState } from 'react'
import TldrawEditor from './TldrawEditor'
import { trpc } from '@/server/trpc/client'

type Props = { designId: string }

export default function TldrawPage({ designId }: Props) {
  const [status, setStatus] = useState<'idle'|'loading'|'saving'|'saved'|'error'>('idle')
  const editorRef = useRef<import('@tldraw/tldraw').Editor | null>(null)

  // Query per carregar el disseny si existeix
  const getQuery = trpc.design.get.useQuery({ id: designId }, { enabled: false })
  const saveMutation = trpc.design.save.useMutation()

  // Carregar en montar
  useEffect(() => {
    const load = async () => {
      setStatus('loading')
      const res = await getQuery.refetch()
      const editor = editorRef.current
      try {
        if (editor && res.data?.found) {
          // Carregar snapshot a l'editor
          // @ts-expect-error tipus interns de tldraw
          editor.store.loadSnapshot(res.data.snapshot)
        }
        setStatus('idle')
      } catch (e) {
        console.error(e)
        setStatus('error')
      }
    }
    load()
  }, [designId])

  const handleSave = async () => {
    const editor = editorRef.current
    if (!editor) return
    try {
      setStatus('saving')
      const snapshot = editor.store.getSnapshot()
      await saveMutation.mutateAsync({ id: designId, snapshot })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 1000)
    } catch (e) {
      console.error(e)
      setStatus('error')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* HEADER de 75px */}
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
          {status === 'loading' && 'Carregant…'}
          {status === 'saving' && 'Desant…'}
          {status === 'saved' && 'Desat ✓'}
          {status === 'error' && 'Error'}
        </span>
      </header>

      {/* CONTINGUT */}
      <main style={{ flex: 1, position: 'relative' }}>
        <TldrawEditor onEditorReady={(editor) => (editorRef.current = editor)} />
      </main>
    </div>
  )
}
