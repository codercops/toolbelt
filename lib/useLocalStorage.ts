"use client";

import { useCallback, useEffect, useState } from "react";

export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: T | ((prev: T) => T)) => void, () => void, Error | null] {
  const [value, setValue] = useState<T>(initial);
  const [persistError, setPersistError] = useState<Error | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, [key]);

  // Wait for the render that has the stored value, or the initial value
  // would be written over it on mount.
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      setPersistError(null);
    } catch (e) {
      // Quota exceeded or serialization failure — surface it so callers can warn
      // the user instead of silently dropping their data.
      setPersistError(e instanceof Error ? e : new Error("Storage write failed"));
    }
  }, [key, value, loaded]);

  // Adopt changes made under the same key by another tab, so a later write
  // from this tab does not overwrite what the other tab just saved.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return;

      try {
        setValue(event.newValue === null ? initial : (JSON.parse(event.newValue) as T));
        setPersistError(null);
      } catch {
        /* ignore malformed storage */
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, initial]);

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
