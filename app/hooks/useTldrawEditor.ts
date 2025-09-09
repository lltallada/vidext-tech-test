import { useCallback, useEffect, useRef, useState } from 'react';
import { trpc } from '@/server/trpc/client';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';

import type { Editor } from '@tldraw/tldraw';
import {
  getSnapshot as tldrawGetSnapshot,
  loadSnapshot as tldrawLoadSnapshot,
} from '@tldraw/tldraw';
import { attachTldrawAutosave } from '../lib/tldrawAutosave';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function useTldrawEditor(
  designId: string,
  initialSnapshot: unknown | null
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const editorRef = useRef<Editor | null>(null);

  const [editorReady, setEditorReady] = useState(false);

  const utils = trpc.useContext();
  const queryClient = useQueryClient();
  const createdOnceRef = useRef(false);

  const saveMutation = trpc.design.save.useMutation({
    onSuccess: (data, variables) => {
      const updatedAt = (data as any)?.updatedAt ?? Date.now();
      utils.design.get.setData({ id: variables.id }, () => ({
        updatedAt,
        found: true,
        snapshot: variables.snapshot,
      }));

      const isFirstSave = !createdOnceRef.current;
      if (!isFirstSave) return;
      createdOnceRef.current = true;

      const listKey = getQueryKey(trpc.design.list, undefined, 'query');
      queryClient.removeQueries({
        queryKey: listKey,
        type: 'inactive',
        exact: true,
      });

      utils.design.list.invalidate();
    },
  });

  const lastKnownSnapshotRef = useRef<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

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
    lastSavedSnapshotRef.current = null;
  }, [designId]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const cleanup = attachTldrawAutosave(editor, {
      designId,
      getSnapshot,
      saveMutation,
      lastSavedSnapshotRef,
      lastKnownSnapshotRef,
      debounceTimerRef,
      isSavingRef,
      setStatus,
    });

    return () => {
      cleanup();
    };
  }, [editorReady]);

  return {
    editorRef,
    status,
    handleReady,
  };
}
