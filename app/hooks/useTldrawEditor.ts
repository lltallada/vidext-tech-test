import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/server/trpc/client';
import type { Editor } from '@tldraw/tldraw';
import {
  getSnapshot as tldrawGetSnapshot,
  loadSnapshot as tldrawLoadSnapshot,
} from 'tldraw';

type Status = 'idle' | 'saving' | 'saved' | 'error';

export default function useTldrawEditor(
  designId: string,
  initialSnapshot: unknown | null,
  options?: {
    initialZoom?: 'fit' | 'fit-x' | 'fit-y' | number;
    fitPadding?: number;
    fitAttempts?: number;
    fitDelay?: number;
  }
) {
  const {
    initialZoom,
    fitPadding = 40,
    fitAttempts = 3,
    fitDelay = 50,
  } = options || {};
  const [status, setStatus] = useState<Status>('idle');
  const editorRef = useRef<Editor | null>(null);

  const saveMutation = trpc.design.save.useMutation();

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

      // --- new: fit / initial zoom logic (best-effort, tolerant) ---
      try {
        const api: any = editor;
        // numeric zoom: set camera zoom directly if possible
        if (typeof initialZoom === 'number') {
          try {
            api.setCamera?.({ ...(api.camera || {}), zoom: initialZoom });
          } catch {
            /* ignore */
          }
        } else if (initialZoom === 'fit' || !initialZoom) {
          // run zoomToFit attempts
          let attempt = 0;
          const doFit = () => {
            try {
              api.zoomToFit?.({ padding: fitPadding });
            } catch {
              /* ignore */
            }
          };
          const loop = () => {
            if (attempt++ >= fitAttempts) return;
            requestAnimationFrame(() => {
              doFit();
              if (attempt < fitAttempts) {
                setTimeout(loop, fitDelay);
              }
            });
          };
          doFit();
          loop();
        } else if (initialZoom === 'fit-x' || initialZoom === 'fit-y') {
          // fit, then adjust zoom to satisfy one axis
          let attempt = 0;
          const adjust = () => {
            try {
              // best-effort: read page bounds & viewport
              const pageBounds =
                api.getPageBounds?.() || api.store?.getPageBounds?.() || null;
              const viewport = api.viewportSize || {
                width: api.container?.clientWidth ?? 1,
                height: api.container?.clientHeight ?? 1,
              };
              const camera = api.camera || { x: 0, y: 0, zoom: 1 };

              if (pageBounds) {
                const contentW = pageBounds[2] - pageBounds[0];
                const contentH = pageBounds[3] - pageBounds[1];
                if (initialZoom === 'fit-x' && contentW > 0) {
                  const desiredZoom = viewport.width / contentW;
                  api.setCamera?.({ ...camera, zoom: desiredZoom });
                } else if (initialZoom === 'fit-y' && contentH > 0) {
                  const desiredZoom = viewport.height / contentH;
                  api.setCamera?.({ ...camera, zoom: desiredZoom });
                }
              }
            } catch {
              /* ignore */
            }
          };

          const doFitThenAdjust = () => {
            try {
              api.zoomToFit?.({ padding: fitPadding });
            } catch {
              /* ignore */
            }
            requestAnimationFrame(() => {
              adjust();
            });
          };

          const loop = () => {
            if (attempt++ >= fitAttempts) return;
            requestAnimationFrame(() => {
              doFitThenAdjust();
              if (attempt < fitAttempts) {
                setTimeout(loop, fitDelay);
              }
            });
          };
          doFitThenAdjust();
          loop();
        }
      } catch {
        // swallow zoom errors — optional feature only
      }
      // --- end fit logic ---

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
    [
      initialSnapshot,
      readSnapshot,
      designId,
      saveMutation,
      initialZoom,
      fitPadding,
      fitAttempts,
      fitDelay,
    ]
  );

  // selection state exposed to consumers
  const [isShapeSelected, setIsShapeSelected] = useState<boolean>(false);

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
          setIsShapeSelected(ids.length > 0);
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
    isShapeSelected,
  };
}
