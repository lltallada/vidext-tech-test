import type { Editor, TLEventMapHandler } from '@tldraw/tldraw';

type Snapshot = Record<string, unknown>;
type SaveInput = { id: string; snapshot: unknown };

export function attachTldrawAutosave(
  editor: Editor,
  {
    designId,
    getSnapshot,
    saveMutation,
    lastSavedSnapshotRef,
    lastKnownSnapshotRef,
    debounceTimerRef,
    isSavingRef,
    setStatus,
  }: {
    designId: string;
    getSnapshot: (e?: Editor | null) => Snapshot | null;
    saveMutation: { mutateAsync: (input: SaveInput) => Promise<unknown> };
    lastSavedSnapshotRef: { current: string | null };
    lastKnownSnapshotRef: { current: string | null };
    debounceTimerRef: { current: number | null };
    isSavingRef: { current: boolean };
    setStatus: (s: 'idle' | 'saving' | 'saved' | 'error') => void;
  }
) {
  const handleChangeEvent: TLEventMapHandler<'change'> = change => {
    const scheduleSave = () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = window.setTimeout(async () => {
        if (isSavingRef.current) return;
        let snapToSave: Snapshot;
        try {
          snapToSave = getSnapshot(editor) ?? {};
        } catch {
          return;
        }
        let snapStr: string;
        try {
          snapStr = JSON.stringify(snapToSave);
        } catch {
          return;
        }

        if (lastSavedSnapshotRef.current === snapStr) {
          return;
        }

        try {
          isSavingRef.current = true;
          setStatus('saving');

          await saveMutation.mutateAsync({
            id: designId,
            snapshot: snapToSave,
          });

          lastSavedSnapshotRef.current = snapStr;
          lastKnownSnapshotRef.current = snapStr;
          setStatus('saved');
          setTimeout(() => setStatus('idle'), 800);
        } catch (e) {
          console.error(e);
          setStatus('error');
        } finally {
          isSavingRef.current = false;
        }
      }, 500);
    };

    for (const record of Object.values(change.changes.added)) {
      if (record.typeName === 'shape') {
        scheduleSave();
        break;
      }
    }

    for (const [from, to] of Object.values(change.changes.updated)) {
      if (from.typeName === 'shape' && to.typeName === 'shape') {
        scheduleSave();
        break;
      }
    }

    for (const record of Object.values(change.changes.removed)) {
      if (record.typeName === 'shape') {
        scheduleSave();
        break;
      }
    }
  };

  const cleanup = editor.store.listen(handleChangeEvent, {
    source: 'user',
    scope: 'all',
  });

  return () => {
    cleanup();
  };
}
