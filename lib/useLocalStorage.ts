"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, Error | null] {
  const [value, setValue] = useState<T>(initial);
  const [persistError, setPersistError] = useState<Error | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    loadedRef.current = true;
  }, [key]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setPersistError(null);
    } catch (e) {
      // Quota exceeded or serialization failure — surface it so callers can warn
      // the user instead of silently dropping their data.
      setPersistError(e instanceof Error ? e : new Error("Storage write failed"));
    }
  }, [key, value]);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    setValue(initial);
  }, [key, initial]);

  return [value, setValue, reset, persistError];
}
