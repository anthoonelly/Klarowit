'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from './icons';
import { DocTabs } from './doc-tabs';
import { DocumentView } from './document-view';
import { EmptyState } from './empty-state';
import { GeneratingView } from './generating-view';
import { RegenerateModal } from './regenerate-modal';
import type {
  Document,
  DocTypeId,
  GeneratedDocContent,
  GenerationStatus,
} from '@/lib/types';

interface Props {
  status: GenerationStatus;
  progress: number;
  docs: Document[];
  activeId: DocTypeId | null;
  setActiveId: (id: DocTypeId) => void;
  onRegenerate: (docId: DocTypeId, note: string) => void;
  errorMessage: string | null;
  projectId: string | null;
  projectName: string;
  onViewProject: () => void;
}

function buildPlainText(c: GeneratedDocContent): string {
  const lines: string[] = [];
  lines.push(c.title.toUpperCase());
  lines.push(c.subtitle);
  lines.push('');
  c.sections.forEach((s, i) => {
    lines.push(`${String(i + 1).padStart(2, '0')}. ${s.heading.toUpperCase()}`);
    lines.push('');
    if (s.body) lines.push(s.body);
    if (s.bullets) s.bullets.forEach((b) => lines.push(`— ${b}`));
    lines.push('');
  });
  lines.push('— koniec dokumentu —');
  return lines.join('\n');
}

export function DocumentPane(props: Props) {
  const [regenModalFor, setRegenModalFor] = useState<DocTypeId | null>(null);
  const [copyFlash, setCopyFlash] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const activeDoc = useMemo(
    () => props.docs.find((d) => d.id === props.activeId) ?? null,
    [props.docs, props.activeId]
  );

  const activeIndex = useMemo(
    () => (props.activeId ? props.docs.findIndex((d) => d.id === props.activeId) : -1),
    [props.docs, props.activeId]
  );

  const doneCount = props.docs.filter((d) => d.state === 'done').length;
  const totalCount = props.docs.length;

  const handleCopy = async () => {
    if (!activeDoc?.content) return;
    try {
      const text = buildPlainText(activeDoc.content);
      await navigator.clipboard.writeText(text);
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1400);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  const handleDownload = async () => {
    if (!activeDoc?.content) return;
    setDownloadError(null);
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: activeDoc.content,
          version: activeDoc.version,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dispo = res.headers.get('Content-Disposition') || '';
      const m = dispo.match(/filename="(.+?)"/);
      a.download = m ? m[1] : `${activeDoc.id}_v${activeDoc.version}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Błąd eksportu.');
    }
  };

  // Idle: empty
  if (props.status === 'idle' && props.docs.length === 0) {
    return (
      <div className="pane pane--right pane--empty">
        <EmptyState />
      </div>
    );
  }

  // Generating with no doc done yet → stages view
  if (
    props.status === 'generating' &&
    !props.docs.some((d) => d.state === 'done')
  ) {
    return (
      <div className="pane pane--right">
        <GeneratingView progress={props.progress} />
      </div>
    );
  }

  const canCopy = !!activeDoc?.content;
  const canDownload = !!activeDoc?.content;

  return (
    <div className="pane pane--right">
      {/* BUG #3 FIX: prominent banner showing where the docs are saved */}
      {props.projectId && doneCount > 0 && (
        <div className="generation-banner">
          <div className="generation-banner__main">
            <div className="generation-banner__eyebrow">
              {props.status === 'done' ? 'Wygenerowano' : 'Trwa generowanie'} ·
              projekt
            </div>
            <div className="generation-banner__title">
              {props.projectName || 'Projekt bez nazwy'}
            </div>
            <div className="generation-banner__meta">
              {doneCount} z {totalCount}{' '}
              {totalCount === 1 ? 'dokumentu' : 'dokumentów'} ·{' '}
              <Link href={`/projects/${props.projectId}`} className="generation-banner__link">
                zobacz wszystkie w projekcie →
              </Link>
            </div>
          </div>
          <button
            className="btn btn--ghost btn--small"
            onClick={props.onViewProject}
            type="button"
          >
            Otwórz projekt
          </button>
        </div>
      )}

      <DocTabs
        docs={props.docs}
        activeId={props.activeId}
        setActiveId={props.setActiveId}
        status={props.status}
        progress={props.progress}
        onCopy={handleCopy}
        onDownload={handleDownload}
        canCopy={canCopy}
        canDownload={canDownload}
      />

      {copyFlash && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            right: 24,
            zIndex: 60,
            padding: '8px 14px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
          role="status"
        >
          Skopiowano
        </div>
      )}

      {downloadError && (
        <div style={{ margin: '16px 24px' }}>
          <div className="error-banner" role="alert">
            <Icon.AlertTriangle className="error-banner__icon" />
            <div>{downloadError}</div>
            <button
              className="error-banner__close"
              onClick={() => setDownloadError(null)}
              aria-label="Zamknij"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {!activeDoc && (
        <div className="doc-placeholder">
          <div className="doc-placeholder__pill">Wybierz zakładkę powyżej</div>
        </div>
      )}

      {activeDoc?.state === 'queued' && (
        <div className="doc-placeholder">
          <div className="doc-placeholder__pill">W kolejce</div>
          <h2 className="doc-placeholder__title">{activeDoc.title}</h2>
          <p className="doc-placeholder__hint">
            Ten dokument zostanie wygenerowany po ukończeniu poprzednich.
          </p>
        </div>
      )}

      {activeDoc?.state === 'generating' && (
        <div className="doc-placeholder">
          <div className="doc-placeholder__pill is-active">
            <span className="spinner spinner--xs" /> Generuję ten dokument…
          </div>
          <h2 className="doc-placeholder__title">{activeDoc.title}</h2>
          <p className="doc-placeholder__hint">
            Model analizuje transkrypcję i pisze sekcje. Może to potrwać 20–60s.
          </p>
        </div>
      )}

      {activeDoc?.state === 'error' && (
        <div className="doc-placeholder">
          <div className="doc-placeholder__pill is-error">
            <Icon.AlertTriangle style={{ width: 12, height: 12 }} /> Błąd
            generowania
          </div>
          <h2 className="doc-placeholder__title">{activeDoc.title}</h2>
          <p className="doc-placeholder__hint">
            {activeDoc.errorMessage ||
              'Nie udało się wygenerować tego dokumentu.'}
          </p>
        </div>
      )}

      {activeDoc?.state === 'done' && activeDoc.content && (
        <DocumentView
          doc={activeDoc}
          index={activeIndex}
          total={props.docs.length}
          onRegenerate={() => setRegenModalFor(activeDoc.id)}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />
      )}

      <RegenerateModal
        open={!!regenModalFor}
        docTitle={
          props.docs.find((d) => d.id === regenModalFor)?.title || ''
        }
        currentVersion={
          props.docs.find((d) => d.id === regenModalFor)?.version || 1
        }
        onClose={() => setRegenModalFor(null)}
        onConfirm={(note) => {
          if (regenModalFor) {
            props.onRegenerate(regenModalFor, note);
          }
          setRegenModalFor(null);
        }}
      />
    </div>
  );
}
