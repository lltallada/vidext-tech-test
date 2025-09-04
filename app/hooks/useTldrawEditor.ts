import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/server/trpc/client';
import type { Editor, TLEventMapHandler } from '@tldraw/tldraw';
import {
  getSnapshot as tldrawGetSnapshot,
  loadSnapshot as tldrawLoadSnapshot,
} from '@tldraw/tldraw';

export default function useTldrawEditor(
  designId: string,
  initialSnapshot: unknown | null
) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const editorRef = useRef<Editor | null>(null);

  const [editorReady, setEditorReady] = useState(false);

  type SaveInput = { id: string; snapshot: unknown };
  const saveMutation = trpc.design.save.useMutation<SaveInput>();

  const lastKnownSnapshotRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const hasPendingSaveRef = useRef(false);

  const getSnapshot = useCallback((e = editorRef.current) => {
    if (!e) return null;
    try {
      if (typeof tldrawGetSnapshot === 'function' && (e as any).store) {
        return tldrawGetSnapshot((e as any).store);
      }
      return (e as any).store?.getSnapshot?.() ?? null;
    } catch {
      return null;
    }
  }, []);

  const loadSnapshot = useCallback((e: Editor, value: unknown) => {
    try {
      const snap = typeof value === 'string' ? JSON.parse(value) : value;
      if (!snap) return;
      if (typeof tldrawLoadSnapshot === 'function' && (e as any).store) {
        tldrawLoadSnapshot((e as any).store, snap);
      } else {
        (e as any).store?.loadSnapshot?.(snap);
      }
    } catch (err) {
      console.warn('useTldrawEditor: failed to load initial snapshot', err);
    }
  }, []);

  const handleReady = useCallback(
    (e: Editor) => {
      editorRef.current = e;
      setEditorReady(true);

      if (initialSnapshot) loadSnapshot(e, initialSnapshot);

      try {
        lastSavedSnapshotRef.current = JSON.stringify(getSnapshot(e) ?? {});
      } catch {
        lastSavedSnapshotRef.current = null;
      }
    },
    [initialSnapshot, getSnapshot, loadSnapshot]
  );

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleChangeEvent: TLEventMapHandler<'change'> = change => {
      const scheduleSave = () => {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(async () => {
          if (isSavingRef.current) return;
          let snapToSave: any;
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

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (from.typeName === 'shape' && to.typeName === 'shape') {
          scheduleSave();
          break;
        }
      }

      // Removed
      for (const record of Object.values(change.changes.removed)) {
        if (record.typeName === 'shape') {
          scheduleSave();
          break;
        }
      }
    };

    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      source: 'user',
      scope: 'all',
    });

    return () => {
      cleanupFunction();
    };
  }, [editorReady]);

  return {
    editorRef,
    status,
    handleReady,
  };
}
