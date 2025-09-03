import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/server/trpc/client';
import type { Editor } from '@tldraw/tldraw';
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

      // Prefer event-driven change detection if available
      try {
        const sideEffects: any = (editor as any).sideEffects;
        if (
          sideEffects &&
          typeof sideEffects.registerAfterChangeHandler === 'function'
        ) {
          // Register a handler that computes a small fingerprint of document content (shapes/pages)
          const disposer = sideEffects.registerAfterChangeHandler(() => {
            try {
              const snap: any = readSnapshot(editor) ?? {};
              const inner = snap.store ?? snap;
              const shapes = inner.shapes ?? {};
              const pages = inner.document?.pages ?? inner.pages ?? {};
              // lightweight fingerprint: keys only (sorted) — avoids selection/appState noise
              const fp = JSON.stringify({
                shapes: Object.keys(shapes).sort(),
                pages: Object.keys(pages).sort(),
              });
              if (lastKnownSnapshotRef.current !== fp) {
                lastKnownSnapshotRef.current = fp;
                // Debounce/save mechanism (reuse your existing debounceTimerRef pattern)
                if (debounceTimerRef.current)
                  window.clearTimeout(debounceTimerRef.current);
                debounceTimerRef.current = window.setTimeout(async () => {
                  if (isSavingRef.current) return;
                  if (
                    lastSavedSnapshotRef.current ===
                    lastKnownSnapshotRef.current
                  )
                    return;
                  const snapToSave = readSnapshot(editor) ?? {};
                  try {
                    isSavingRef.current = true;
                    setStatus('saving');

                    // saving without thumbnail
                    await saveMutation.mutateAsync({
                      id: designId,
                      snapshot: snapToSave,
                    });
                    lastSavedSnapshotRef.current = lastKnownSnapshotRef.current;
                    setStatus('saved');
                    setTimeout(() => setStatus('idle'), 800);
                  } catch (e) {
                    console.error(e);
                    setStatus('error');
                  } finally {
                    isSavingRef.current = false;
                  }
                }, 500);
              }
            } catch {
              // ignore read errors inside handler
            }
          });
          changeDisposerRef.current = disposer;
        }
      } catch {
        // ignore if API absent or fails — polling fallback will run
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
    const pollInterval = 700;
    const debounceMs = 800;

    function startPolling() {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
      }
      pollingTimerRef.current = window.setInterval(() => {
        const editor = editorRef.current;
        if (!editor) return;

        try {
          const ids = getSelectedIds();
          setSelectedShapes(ids);
        } catch {
          // ignore
        }

        let curStr: string;
        try {
          const snap = readSnapshot(editor) ?? {};
          curStr = JSON.stringify(snap);
        } catch {
          return;
        }
        if (lastKnownSnapshotRef.current !== curStr) {
          lastKnownSnapshotRef.current = curStr;
          if (debounceTimerRef.current) {
            window.clearTimeout(debounceTimerRef.current);
          }
          debounceTimerRef.current = window.setTimeout(async () => {
            if (isSavingRef.current) return;
            if (lastSavedSnapshotRef.current === lastKnownSnapshotRef.current)
              return;
            const snapToSave = readSnapshot(editor) ?? {};
            try {
              isSavingRef.current = true;
              setStatus('saving');

              // save without thumbnail
              await saveMutation.mutateAsync({
                id: designId,
                snapshot: snapToSave,
              });

              lastSavedSnapshotRef.current = lastKnownSnapshotRef.current;
              setStatus('saved');
              setTimeout(() => setStatus('idle'), 800);
            } catch (e) {
              console.error(e);
              setStatus('error');
            } finally {
              isSavingRef.current = false;
            }
          }, debounceMs);
        }
      }, pollInterval);
    }

    startPolling();

    return () => {
      if (changeDisposerRef.current) {
        const d = changeDisposerRef.current;
        try {
          if (typeof d === 'function') d();
          else if (d?.dispose) d.dispose();
        } catch {
          /* ignore */
        }
      }
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
      }
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [designId, saveMutation, readSnapshot, getSelectedIds]);

  return {
    editorRef,
    status,
    handleReady,
    selectedShapes,
  };
}
