'use client';

import { Tldraw, type Editor, TLUiComponents } from '@tldraw/tldraw';
import '@tldraw/tldraw/tldraw.css';
import useTldrawEditor from '../../hooks/useTldrawEditor';
import TldrawHeader from './TldrawHeader';

type Props = {
  designId: string;
  initialSnapshot: unknown | null;
};

function InlineTldrawEditor({
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

export default function TldrawPage({ designId, initialSnapshot }: Props) {
  const { status, handleReady } = useTldrawEditor(designId, initialSnapshot);

  const components: TLUiComponents = {
    TopPanel: () => <TldrawHeader status={status} />,
  };

  return (
    <main className="h-dvh relative flex-1">
      <InlineTldrawEditor onEditorReady={handleReady} components={components} />
    </main>
  );
}
