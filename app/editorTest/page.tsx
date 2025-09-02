// app/page.tsx
'use client'

import * as React from 'react'
import { Tldraw, track, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'

/**
 * Component "tracked" que mostra els IDs dels shapes seleccionats
 */
const SelectedIds = track(() => {
  const editor = useEditor()
  const ids = editor.getSelectedShapeIds()

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        background: 'rgba(0,0,0,0.6)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontFamily: 'monospace',
      }}
    >
      Seleccionats: {ids.length > 0 ? ids.join(', ') : '—'}
    </div>
  )
})

export default function Page() {
  return (
    <main style={{ position: 'fixed', inset: 0 }}>
      <Tldraw persistenceKey="next-tldraw-demo">
        <SelectedIds  />
      </Tldraw>
    </main>
  )
}
