"use client";

import { useEffect, useRef } from "react";

const draftKey = (testId: string) => `test-editor-draft:${testId}`;

export function useTestEditorDraft<T extends { id: string }>(
  testId: string,
  test: T,
  setTest: React.Dispatch<React.SetStateAction<T | null>>,
  onDirtyChange?: (dirty: boolean) => void
) {
  const hydrated = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(draftKey(testId));
      if (raw) {
        const parsed = JSON.parse(raw) as T;
        if (parsed?.id === testId) {
          setTest(parsed);
        }
      }
    } catch {
      /* ignore corrupt draft */
    }
    hydrated.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  useEffect(() => {
    if (!hydrated.current || typeof window === "undefined") return;
    dirty.current = true;
    onDirtyChange?.(true);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(testId), JSON.stringify(test));
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
  };
}
