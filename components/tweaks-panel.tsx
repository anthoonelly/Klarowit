'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import type { Tweaks } from '@/lib/types';

interface Props {
  tweaks: Tweaks;
  update: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void;
}

interface OptionGroup<K extends keyof Tweaks> {
  key: K;
  label: string;
  options: { value: Tweaks[K]; label: string }[];
}

const GROUPS: [
  OptionGroup<'accent'>,
  OptionGroup<'theme'>,
  OptionGroup<'serif'>,
  OptionGroup<'density'>,
] = [
  {
    key: 'accent',
    label: 'Akcent',
    options: [
      { value: 'amber', label: 'Amber' },
      { value: 'cinnabar', label: 'Cynober' },
      { value: 'moss', label: 'Mech' },
      { value: 'ink', label: 'Tusz' },
    ],
  },
  {
    key: 'theme',
    label: 'Motyw',
    options: [
      { value: 'light', label: 'Jasny' },
      { value: 'dark', label: 'Ciemny' },
    ],
  },
  {
    key: 'serif',
    label: 'Krój nagłówków',
    options: [
      { value: 'instrument', label: 'Instrument' },
      { value: 'fraunces', label: 'Fraunces' },
      { value: 'geist', label: 'Geist' },
    ],
  },
  {
    key: 'density',
    label: 'Gęstość',
    options: [
      { value: 'comfortable', label: 'Komfortowa' },
      { value: 'compact', label: 'Kompaktowa' },
    ],
  },
];

export function TweaksPanel({ tweaks, update }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="tweaks" ref={ref}>
      <button
        className="tweaks__toggle"
        onClick={() => setOpen((o) => !o)}
        title="Wygląd"
        aria-expanded={open}
        type="button"
      >
        <Icon.Settings />
      </button>
      {open && (
        <div className="tweaks__panel" role="dialog" aria-label="Ustawienia wyglądu">
          <div className="tweaks__title">Wygląd</div>
          {GROUPS.map((g) => (
            <div className="tweak-group" key={g.key}>
              <div className="tweak-group__label">{g.label}</div>
              <div className="tweak-group__options">
                {g.options.map((opt) => {
                  const active = (tweaks as Tweaks)[g.key] === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      className={`tweak-group__option ${
                        active ? 'is-active' : ''
                      }`}
                      onClick={() =>
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        update(g.key as any, opt.value as any)
                      }
                      type="button"
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
