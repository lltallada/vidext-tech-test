'use client';

import { Tldraw, type Editor, TLUiComponents } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';

export default function TldrawEditor({
  onEditorReady,
  hideUi,
  components,
}: {
  onEditorReady?: (editor: Editor) => void;
  hideUi?: boolean;
  components?: TLUiComponents;
}) {
  return (
    <div className="absolute inset-0">
      <Tldraw
        persistenceKey={undefined}
        onMount={editor => {
          onEditorReady?.(editor);
        }}
        hideUi={hideUi}
        components={components}
      />
    </div>
  );
}
