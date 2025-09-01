'use client'

import { useRef, useState, useEffect } from 'react'
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

  // Track last known snapshot (string) and last saved snapshot (string)
  const lastKnownSnapshotRef = useRef<string | null>(null)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<number | null>(null)
  const pollingTimerRef = useRef<number | null>(null)
  const isSavingRef = useRef(false)

  const handleReady = (editor: Editor) => {
    editorRef.current = editor
    if (initialSnapshot) {
      // tldraw accepta el snapshot JSON serialitzable
      // @ts-expect-error tipus interns de tldraw
      editor.store.loadSnapshot(initialSnapshot)
      // initialize snapshot refs from the loaded snapshot
      try {
        const s = JSON.stringify(editor.store.getSnapshot())
        lastKnownSnapshotRef.current = s
        lastSavedSnapshotRef.current = s
      } catch {
        // ignore stringify errors
      }
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

  // Auto-save implementation: poll editor snapshot, debounce changes, and save
  useEffect(() => {
    const pollInterval = 700 // ms
    const debounceMs = 800

    function startPolling() {
      // clear any existing
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current)
      }
      pollingTimerRef.current = window.setInterval(() => {
        const editor = editorRef.current
        if (!editor) return
        let curStr: string
        try {
          curStr = JSON.stringify(editor.store.getSnapshot())
        } catch {
          return
        }
        // If snapshot changed since last known, reset debounce
        if (lastKnownSnapshotRef.current !== curStr) {
          lastKnownSnapshotRef.current = curStr
          if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current)
          }
          debounceTimerRef.current = window.setTimeout(async () => {
            // don't save if it's already equal to last saved
            if (isSavingRef.current) return
            if (lastSavedSnapshotRef.current === lastKnownSnapshotRef.current) return
            const snapToSave = editor.store.getSnapshot()
            try {
              isSavingRef.current = true
              setStatus('saving')
              await saveMutation.mutateAsync({ id: designId, snapshot: snapToSave })
              lastSavedSnapshotRef.current = lastKnownSnapshotRef.current
              setStatus('saved')
              setTimeout(() => setStatus('idle'), 800)
            } catch (e) {
              console.error(e)
              setStatus('error')
            } finally {
              isSavingRef.current = false
            }
          }, debounceMs)
        }
      }, pollInterval)
    }

    startPolling()

    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current)
      }
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [designId, saveMutation])

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