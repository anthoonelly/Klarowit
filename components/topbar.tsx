'use client';

import { Icon } from './icons';
import type { GenerationStatus } from '@/lib/types';

interface TopBarProps {
  status: GenerationStatus;
  contextSummary: string;
  onOpenContext: () => void;
}

export function TopBar({ status, contextSummary, onOpenContext }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar__brand">
        <div className="brand__mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="22" height="22">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path d="M9 16h14M16 9v14" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3" fill="currentColor" />
          </svg>
        </div>
        <div className="brand__text">
          <div className="brand__name">Klarowit</div>
          <div className="brand__tag">transkrypcja → dokumentacja</div>
        </div>
      </div>

      <nav className="topbar__nav" aria-label="Nawigacja główna">
        <a className="is-active" aria-current="page">
          Workspace
        </a>
        <a>Projekty</a>
        <a>Szablony</a>
        <a>Audyt B+R</a>
      </nav>

      <div className="topbar__right">
        <button
          className="ctx-chip"
          onClick={onOpenContext}
          title="Kontekst AI — instrukcje i wzorce"
        >
          <Icon.Book className="ctx-chip__icon" />
          <span>Kontekst</span>
          <span className="ctx-chip__sep">·</span>
          <span className="ctx-chip__count">{contextSummary}</span>
        </button>
        <div
          className={`status-pill status-pill--${status}`}
          role="status"
          aria-live="polite"
        >
          <span className="status-pill__dot" aria-hidden />
          {status === 'idle' && 'Gotowy'}
          {status === 'generating' && 'Generuję'}
          {status === 'done' && 'Ukończono'}
          {status === 'error' && 'Błąd'}
        </div>
        <div className="avatar" aria-hidden>
          JK
        </div>
      </div>
    </header>
  );
}
