'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * SSR-safe localStorage hook.
 * - Reads `initial` value during SSR (avoids hydration mismatch).
 * - On mount, hydrates from localStorage if a stored value exists.
 * - Writes back to localStorage on every change.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initial);
  const isHydrated = useRef(false);

  // Hydrate from storage once on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Ignore parse errors — fall back to initial.
    } finally {
      isHydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persist on change (after hydration so we don't overwrite stored values
  // with the initial during the first render).
  useEffect(() => {
    if (!isHydrated.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage may be full or disabled (private mode).
    }
  }, [key, value]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof next === 'function' ? (next as (p: T) => T)(prev) : next
    );
  }, []);

  return [value, set];
}
