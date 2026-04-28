'use client';

import { Icon } from './icons';
import type { Document, GeneratedDocContent } from '@/lib/types';

interface Props {
  doc: Document;
  index: number;
  total: number;
  onRegenerate: () => void;
  onDownload: () => void;
  onCopy: () => void;
}

export function DocumentView({
  doc,
  index,
  total,
  onRegenerate,
  onDownload,
  onCopy,
}: Props) {
  if (!doc.content) return null;
  const c = doc.content as GeneratedDocContent;

  return (
    <div className="doc">
      <div className="doc__head">
        <div className="doc__head-actions">
          <button
            className="icon-btn"
            title="Regeneruj z uwagami"
            onClick={onRegenerate}
            type="button"
          >
            <Icon.Refresh />
          </button>
          <button
            className="icon-btn"
            title="Kopiuj"
            onClick={onCopy}
            type="button"
          >
            <Icon.Copy />
          </button>
          <button
            className="icon-btn"
            title="Pobierz .docx"
            onClick={onDownload}
            type="button"
          >
            <Icon.Download />
          </button>
        </div>
        <div className="doc__eyebrow">
          Dokument {String(index + 1).padStart(2, '0')} z{' '}
          {String(total).padStart(2, '0')} ·{' '}
          {new Date().toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </div>
        <h1 className="doc__title">{c.title}</h1>
        <div className="doc__meta">
          <span>{c.subtitle}</span>
          <span>·</span>
          <span>v{doc.version}.0</span>
          <span>·</span>
          <span>{c.sections.length} sekcji</span>
        </div>
      </div>

      {c.sections.map((section, i) => (
        <section className="doc-section" key={i}>
          <div className="doc-section__num">
            {String(i + 1).padStart(2, '0')}
          </div>
          <h2 className="doc-section__heading">{section.heading}</h2>
          {section.body && (
            <p className="doc-section__body">{section.body}</p>
          )}
          {section.bullets && section.bullets.length > 0 && (
            <ul className="doc-section__bullets">
              {section.bullets.map((b, j) => (
                <li key={j}>{b}</li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className="doc__foot">— koniec dokumentu — Klarowit · v{doc.version}.0</div>
    </div>
  );
}
