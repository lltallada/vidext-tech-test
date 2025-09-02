'use client';

import TldrawEditor from './draw/TldrawEditor';
import useTldrawEditor from '../hooks/useTldrawEditor';
type Props = {
  designId: string;
  initialSnapshot: unknown | null;
};

export default function TldrawThumbnailDetail({
  designId,
  initialSnapshot,
}: Props) {
  // moved editor logic to hook
  const { handleReady } = useTldrawEditor(designId, initialSnapshot);

  //return <p>thumbnail fail</p>;

  return <TldrawEditor onEditorReady={handleReady} hideUi />;
}
