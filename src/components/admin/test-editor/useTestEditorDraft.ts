"use client";

import { useEffect, useRef } from "react";

const draftKey = (testId: string) => `test-editor-draft:${testId}`;

type DraftEnvelope<T> = {
  version: 2;
  testId: string;
  serverUpdatedAt: string | null;
  savedAt: string;
  data: T;
};

function normalizeVersion(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? value : new Date(timestamp).toISOString();
}

export function createTestEditorDraft<T extends { id: string }>(
  testId: string,
  serverUpdatedAt: unknown,
  data: T
): DraftEnvelope<T> {
  return {
    version: 2,
    testId,
    serverUpdatedAt: normalizeVersion(serverUpdatedAt),
    savedAt: new Date().toISOString(),
    data,
  };
}

export function readTestEditorDraft<T extends { id: string }>(
  raw: string,
  testId: string,
  serverUpdatedAt: unknown
): T | null {
  const parsed = JSON.parse(raw) as DraftEnvelope<T> | T | null;
  if (!parsed || typeof parsed !== "object" || !("version" in parsed)) return null;
  if (
    parsed.version !== 2 ||
    !("data" in parsed) ||
    parsed.testId !== testId ||
    parsed.data?.id !== testId ||
    normalizeVersion(parsed.serverUpdatedAt) !== normalizeVersion(serverUpdatedAt)
  ) {
    return null;
  }
  return parsed.data;
}

export function useTestEditorDraft<T extends { id: string; updatedAt?: string }>(
  testId: string,
  test: T,
  setTest: React.Dispatch<React.SetStateAction<T | null>>,
  onDirtyChange?: (dirty: boolean) => void
) {
  const hydrated = useRef(false);
  const dirty = useRef(false);
  const skipInitialPersist = useRef(true);
  const skipNextPersist = useRef(false);
  const serverVersion = useRef(normalizeVersion(test.updatedAt));

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(draftKey(testId));
      if (raw) {
        const restored = readTestEditorDraft<T>(raw, testId, serverVersion.current);
        if (restored) {
          setTest(restored);
        } else {
          // Старый формат или черновик от предыдущей версии записи.
          // Он не должен затирать свежий импорт/данные с сервера.
          localStorage.removeItem(draftKey(testId));
        }
      }
    } catch {
      localStorage.removeItem(draftKey(testId));
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    if (skipInitialPersist.current) {
      skipInitialPersist.current = false;
      return;
    }
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    dirty.current = true;
    onDirtyChange?.(true);
    const timer = setTimeout(() => {
      try {
        const envelope = createTestEditorDraft(testId, serverVersion.current, test);
        localStorage.setItem(draftKey(testId), JSON.stringify(envelope));
      } catch {
        /* quota */
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [test, testId, onDirtyChange]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  return {
    clearDraft: () => {
      dirty.current = false;
      onDirtyChange?.(false);
      try {
        localStorage.removeItem(draftKey(testId));
      } catch {
        /* ignore */
      }
    },
    markClean: () => {
      dirty.current = false;
      onDirtyChange?.(false);
    },
    acceptServerVersion: (updatedAt: unknown) => {
      serverVersion.current = normalizeVersion(updatedAt);
      skipNextPersist.current = true;
      dirty.current = false;
      onDirtyChange?.(false);
      try {
        localStorage.removeItem(draftKey(testId));
      } catch {
        /* ignore */
      }
    },
  };
}
