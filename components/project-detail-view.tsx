'use client';

import { useState } from 'react';
import { Icon } from './icons';
import type { PersistedDocument } from '@/lib/types';

interface ViewDoc extends PersistedDocument {
  niceTitle: string;
}

interface Props {
  projectId: string;
  projectName: string;
  documents: ViewDoc[];
}

export function ProjectDetailView({
  projectId,
  projectName,
  documents,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(
    documents[0]?.id ?? null
  );
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const active = documents.find((d) => d.id === activeId) ?? null;

  if (documents.length === 0) {
    return (
      <div className="page__empty">
        <p>Ten projekt nie ma jeszcze żadnych wygenerowanych dokumentów.</p>
        <a
          href={`/workspace?project=${projectId}`}
          className="btn btn--primary"
        >
          Wygeneruj dokumenty
        </a>
      </div>
    );
  }

  const handleDownload = async (doc: ViewDoc) => {
    setDownloadError(null);
    try {
      const res = await fetch('/api/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: doc.content, version: doc.version }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dispo = res.headers.get('Content-Disposition') || '';
      const m = dispo.match(/filename="(.+?)"/);
      a.download = m ? m[1] : `${doc.docType}_v${doc.version}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Błąd eksportu.');
    }
  };

  return (
    <div className="project-detail">
      <aside className="project-detail__nav" aria-label="Lista dokumentów">
        <div className="project-detail__nav-head">
          {documents.length}{' '}
          {documents.length === 1 ? 'dokument' : 'dokumentów'}
        </div>
        <ul>
          {documents.map((d, i) => {
            const isActive = d.id === activeId;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  className={`project-detail__nav-item ${
                    isActive ? 'is-active' : ''
                  }`}
                  onClick={() => setActiveId(d.id)}
                >
                  <span className="project-detail__nav-num">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="project-detail__nav-title">
                    {d.niceTitle}
                    {d.version > 1 && (
                      <span className="project-detail__nav-ver">
                        v{d.version}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="project-detail__main">
        {downloadError && (
          <div className="error-banner" role="alert">
            <Icon.AlertTriangle className="error-banner__icon" />
            <div>{downloadError}</div>
            <button
              className="error-banner__close"
              onClick={() => setDownloadError(null)}
              type="button"
              aria-label="Zamknij"
            >
              ×
            </button>
          </div>
        )}

        {active && (
          <article className="doc-article">
            <header className="doc-article__head">
              <div className="doc-article__eyebrow">
                {projectName} · v{active.version}
              </div>
              <h2 className="doc-article__title">{active.content.title}</h2>
              <p className="doc-article__sub">{active.content.subtitle}</p>
              <div className="doc-article__actions">
                <button
                  className="btn btn--ghost btn--small"
                  onClick={() => handleDownload(active)}
                  type="button"
                >
                  <Icon.Download className="btn__icon" />
                  Pobierz .docx
                </button>
                <a
                  className="btn btn--ghost btn--small"
                  href={`/workspace?project=${projectId}`}
                >
                  <Icon.Refresh className="btn__icon" />
                  Regeneruj
                </a>
              </div>
            </header>

            <div className="doc-article__body">
              {active.content.sections.map((s, i) => (
                <section key={i} className="doc-section">
                  <h3 className="doc-section__head">
                    <span className="doc-section__num">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.heading}
                  </h3>
                  {s.body && <p className="doc-section__body">{s.body}</p>}
                  {s.bullets && s.bullets.length > 0 && (
                    <ul className="doc-section__bullets">
                      {s.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
