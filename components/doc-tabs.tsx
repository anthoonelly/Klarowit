'use client';

import { Icon } from './icons';
import type { Document, DocTypeId, GenerationStatus } from '@/lib/types';

interface Props {
  docs: Document[];
  activeId: DocTypeId | null;
  setActiveId: (id: DocTypeId) => void;
  status: GenerationStatus;
  progress: number;
  onCopy: () => void;
  onDownload: () => void;
  canCopy: boolean;
  canDownload: boolean;
}

export function DocTabs(props: Props) {
  return (
    <div className="doc-tabs" role="tablist">
      {props.docs.map((d, i) => (
        <button
          key={d.id}
          className={`doc-tab ${d.id === props.activeId ? 'is-active' : ''}`}
          onClick={() => props.setActiveId(d.id)}
          role="tab"
          aria-selected={d.id === props.activeId}
          type="button"
        >
          <span className="doc-tab__num">
            {String(i + 1).padStart(2, '0')}
          </span>
          <span>{d.title}</span>
          {d.state === 'done' && (
            <Icon.Check className="doc-tab__check" aria-label="Gotowe" />
          )}
          {d.state === 'generating' && (
            <span className="doc-tab__spin" aria-label="W trakcie">
              <span className="spinner spinner--xs" />
            </span>
          )}
          {d.state === 'queued' && (
            <span className="doc-tab__queued">w kolejce</span>
          )}
          {d.state === 'error' && (
            <Icon.AlertTriangle className="doc-tab__error" aria-label="Błąd" />
          )}
        </button>
      ))}
      <div className="doc-tabs__actions">
        {props.status === 'generating' && (
          <span className="doc-tabs__progress">
            <span className="doc-tabs__progress-bar">
              <span style={{ width: `${props.progress}%` }} />
            </span>
            {Math.floor(props.progress)}%
          </span>
        )}
        <button
          className="icon-btn"
          title="Kopiuj jako tekst"
          onClick={props.onCopy}
          disabled={!props.canCopy}
          type="button"
        >
          <Icon.Copy />
        </button>
        <button
          className="icon-btn"
          title="Pobierz jako .docx"
          onClick={props.onDownload}
          disabled={!props.canDownload}
          type="button"
        >
          <Icon.Download />
        </button>
      </div>
    </div>
  );
}
