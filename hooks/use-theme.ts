'use client';

import { useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { Theme } from '@/lib/types';

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('memoist:theme', 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return [theme, toggle, setTheme] as const;
}
