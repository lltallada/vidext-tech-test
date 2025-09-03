import _ from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/server/trpc/client';
import type { Editor, TLEventMapHandler } from '@tldraw/tldraw';
import {
  getSnapshot as tldrawGetSnapshot,
  loadSnapshot as tldrawLoadSnapshot,
} from 'tldraw';

export default function useTldrawEditor(
  designId: string,
  initialSnapshot: unknown | null
) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle'
  );
  const editorRef = useRef<Editor | null>(null);
  // tick/state to signal when editorRef.current has been set (refs don't cause re-renders)
  const [editorReadyTick, setEditorReadyTick] = useState(0);

  type SaveInput = { id: string; snapshot: unknown };
  const saveMutation = trpc.design.save.useMutation<SaveInput>();

  const lastKnownSnapshotRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const changeDisposerRef = useRef<any>(null);

  // Helper to read snapshot without calling the deprecated Store.getSnapshot directly
  const readSnapshot = useCallback((editor?: Editor) => {
    try {
      if (!editor) return null;
      if (typeof tldrawGetSnapshot === 'function' && (editor as any).store) {
        return tldrawGetSnapshot((editor as any).store);
      }
      if ((editor as any).store?.getSnapshot) {
        return (editor as any).store.getSnapshot();
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const handleReady = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      // ensure effects that need the editor run by forcing a render
      setEditorReadyTick(t => t + 1);

      if (initialSnapshot) {
        let snapToLoad: any = initialSnapshot;
        try {
          if (typeof snapToLoad === 'string') {
            snapToLoad = JSON.parse(snapToLoad);
          }
        } catch {
          snapToLoad = null;
        }

        if (snapToLoad) {
          try {
            if (
              typeof tldrawLoadSnapshot === 'function' &&
              (editor as any).store
            ) {
              tldrawLoadSnapshot((editor as any).store, snapToLoad);
            } else {
              (editor as any).store?.loadSnapshot?.(snapToLoad);
            }
          } catch (err) {
            console.warn(
              'useTldrawEditor: failed to load initial snapshot',
              err
            );
          }
        }
      }

      try {
        const s = JSON.stringify(readSnapshot(editor) ?? {});
        lastKnownSnapshotRef.current = s;
        lastSavedSnapshotRef.current = s;
      } catch {
        // ignore stringify errors
      }
    },
    [initialSnapshot, readSnapshot, designId, saveMutation]
  );

  // selection state exposed to consumers
  const [selectedShapes, setSelectedShapes] = useState<String[]>([]);

  // normalize selection across tldraw versions / snapshot shapes
  const getSelectedIds = useCallback((): string[] => {
    const editor = editorRef.current;
    if (!editor) return [];
    const e: any = editor;

    const normalize = (raw: any): string[] => {
      if (!raw && raw !== 0) return [];
      if (Array.isArray(raw)) return raw;
      if (raw instanceof Set) return Array.from(raw);
      if (typeof raw === 'string') return [raw];
      if (raw instanceof Map)
        return Array.from((raw as Map<string, any>).keys());
      if (typeof raw === 'object') return Object.keys(raw);
      return [];
    };

    try {
      if (typeof e.getSelectedShapeIds === 'function') {
        const ids = e.getSelectedShapeIds();
        const n = normalize(ids);
        if (n.length) return n;
      }
      if (typeof e.getSelectedIds === 'function') {
        const ids = e.getSelectedIds();
        const n = normalize(ids);
        if (n.length) return n;
      }
      const maybe = e.selectedIds ?? e.selection ?? e.selectionIds ?? null;
      const n = normalize(maybe);
      if (n.length) return n;
    } catch {
      // ignore api access errors
    }

    // fallback: inspect snapshot (handles namespaced entries)
    try {
      const snap: any = readSnapshot(editor) ?? {};
      const inner = snap.store ?? snap;
      const candidates: any[] = [];
      candidates.push(
        inner.selectedIds,
        inner.selection,
        inner.appState?.selectedIds,
        inner.appState?.selection,
        snap.selectedIds,
        snap.selection
      );

      const doc = inner['document:document'] ?? inner.document ?? null;
      if (doc?.pages) {
        for (const pid of Object.keys(doc.pages)) {
          const page = doc.pages[pid];
          candidates.push(page.selectedIds, page.selection, page.selectionIds);
        }
      }
      if (inner.pages) {
        for (const pid of Object.keys(inner.pages)) {
          const page = inner.pages[pid];
          candidates.push(page.selectedIds, page.selection, page.selectionIds);
        }
      }
      for (const k of Object.keys(inner)) {
        if (!k.startsWith('page:')) continue;
        const page = inner[k];
        candidates.push(page?.selectedIds, page?.selection, page?.selectionIds);
      }

      for (const c of candidates) {
        const m = normalize(c);
        if (m.length) return m;
      }
    } catch {
      // ignore snapshot read errors
    }

    return [];
  }, [readSnapshot]);

  useEffect(() => {
    /* CHECK HERE */
    const editor = editorRef.current;
    if (!editor) return;

    //[1]
    const handleChangeEvent: TLEventMapHandler<'change'> = change => {
      // helper to debounce & perform same save logic used elsewhere
      const scheduleSave = () => {
        if (debounceTimerRef.current) {
          window.clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = window.setTimeout(async () => {
          if (isSavingRef.current) return;
          let snapToSave: any;
          try {
            snapToSave = readSnapshot(editor) ?? {};
          } catch {
            return;
          }
          let snapStr: string;
          try {
            snapStr = JSON.stringify(snapToSave);
          } catch {
            // fallback: don't save if we cannot stringify
            return;
          }
          // Avoid saving if nothing meaningful changed since last save
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

      // Added
      for (const record of Object.values(change.changes.added)) {
        if (record.typeName === 'shape') {
          scheduleSave();
          console.log('must save');
          break;
        }
      }

      // Updated
      for (const [from, to] of Object.values(change.changes.updated)) {
        if (from.id.startsWith('shape') && to.id.startsWith('shape')) {
          let diff = _.reduce(
            from,
            (result: any[], value, key: string) =>
              _.isEqual(value, (to as any)[key])
                ? result
                : result.concat([key, (to as any)[key]]),
            []
          );
          if (diff?.[0] === 'props') {
            diff = _.reduce(
              (from as any).props,
              (result: any[], value, key) =>
                _.isEqual(value, (to as any).props[key])
                  ? result
                  : result.concat([key, (to as any).props[key]]),
              []
            );
          }
          scheduleSave();
          console.log('must save');

          break;
        }
      }

      // Removed
      for (const record of Object.values(change.changes.removed)) {
        if (record.typeName === 'shape') {
          scheduleSave();
          console.log('must save');

          break;
        }
      }
    };

    // [2]
    const cleanupFunction = editor.store.listen(handleChangeEvent, {
      source: 'user',
      scope: 'all',
    });

    return () => {
      cleanupFunction();
    };
  }, [editorReadyTick]); // re-run when handleReady set the editor and bumped the

  return {
    editorRef,
    status,
    handleReady,
    selectedShapes,
  };
}
