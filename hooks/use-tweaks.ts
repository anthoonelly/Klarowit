'use client';

import { useEffect } from 'react';
import { useLocalStorage } from './use-local-storage';
import type { Tweaks } from '@/lib/types';

const DEFAULT_TWEAKS: Tweaks = {
  accent: 'amber',
  theme: 'light',
  serif: 'instrument',
  density: 'comfortable',
};

export function useTweaks() {
  const [tweaks, setTweaks] = useLocalStorage<Tweaks>(
    'klarowit:tweaks',
    DEFAULT_TWEAKS
  );

  // Apply to <html> element
  useEffect(() => {
    const r = document.documentElement;
    r.dataset.accent = tweaks.accent;
    r.dataset.theme = tweaks.theme;
    r.dataset.serif = tweaks.serif;
    r.dataset.density = tweaks.density;
  }, [tweaks]);

  const update = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  };

  return [tweaks, update] as const;
}
