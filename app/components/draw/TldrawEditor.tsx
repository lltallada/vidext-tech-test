'use client';

import { Tldraw, type Editor } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function TldrawEditor({
  onEditorReady,
  hideUi,
}: {
  onEditorReady?: (editor: Editor) => void;
  hideUi?: boolean;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <Tldraw
        persistenceKey={undefined}
        onMount={editor => {
          onEditorReady?.(editor);
        }}
        hideUi={hideUi}
      />
    </div>
  );
}
