'use client'

import { Tldraw, type Editor } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'

export default function TldrawEditor({
  onEditorReady,
}: {
  onEditorReady?: (editor: Editor) => void
}) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw
        persistenceKey={undefined}
        onMount={(editor) => {
          onEditorReady?.(editor)
        }}
      />
    </div>
  )
}
