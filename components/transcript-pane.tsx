'use client';

import { useRef, useState } from 'react';
import { Icon } from './icons';
import { DOC_TYPES } from '@/lib/doc-types';
import { SAMPLE_TRANSCRIPT } from '@/lib/sample-data';
import type { DocTypeId, GenerationStatus } from '@/lib/types';

interface Props {
  transcript: string;
  setTranscript: (v: string) => void;
  fileName: string;
  setFileName: (v: string) => void;
  selectedDocs: DocTypeId[];
  toggleDoc: (id: DocTypeId) => void;
  onGenerate: () => void;
  onCancel: () => void;
  status: GenerationStatus;
  onOpenContext: () => void;
}

export function TranscriptPane(props: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const wordCount = props.transcript
    ? props.transcript.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const lineCount = props.transcript ? props.transcript.split('\n').length : 0;

  const handleFile = async (file: File | undefined | null) => {
    if (!file) return;
    setFileError(null);
    setFileLoading(true);

    const lower = file.name.toLowerCase();
    const isDocx = lower.endsWith('.docx');

    try {
      if (isDocx) {
        // Send to server for parsing
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/parse-file', {
          method: 'POST',
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        props.setTranscript(json.text);
        props.setFileName(json.filename);
      } else if (
        lower.endsWith('.txt') ||
        lower.endsWith('.md') ||
        lower.endsWith('.vtt') ||
        lower.endsWith('.srt')
      ) {
        // Read locally — but VTT/SRT need stripping
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/parse-file', {
          method: 'POST',
          body: fd,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        props.setTranscript(json.text);
        props.setFileName(json.filename);
      } else {
        throw new Error(
          'Nieobsługiwany format. Akceptowane: .txt, .md, .vtt, .srt, .docx'
        );
      }
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Błąd wczytywania pliku.');
    } finally {
      setFileLoading(false);
    }
  };

  const loadSample = () => {
    props.setTranscript(SAMPLE_TRANSCRIPT);
    props.setFileName('przykład_smartflow.txt');
    setFileError(null);
  };

  const isGenerating = props.status === 'generating';

  return (
    <div className="pane pane--left">
      <div className="pane__header">
        <div className="pane__eyebrow">01 — Źródło</div>
        <h2 className="pane__title">Transkrypcja</h2>
      </div>

      <div
        className={`dropzone ${dragOver ? 'is-over' : ''} ${
          fileLoading ? 'is-loading' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        onClick={() => fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileRef.current?.click();
          }
        }}
      >
        {fileLoading ? (
          <span
            className="spinner"
            style={{ display: 'block', margin: '0 auto 10px' }}
          />
        ) : (
          <Icon.Upload className="dropzone__icon" />
        )}
        <div className="dropzone__title">
          {fileLoading
            ? 'Wczytuję plik…'
            : props.fileName || 'Upuść plik z transkrypcją'}
        </div>
        <div className="dropzone__hint">
          .txt · .vtt · .srt · .docx — albo kliknij, aby wybrać
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.vtt,.srt,.docx,.md"
          onChange={(e) => handleFile(e.target.files?.[0])}
          hidden
        />
      </div>

      {fileError && (
        <div className="error-banner" role="alert">
          <Icon.AlertTriangle className="error-banner__icon" />
          <div>{fileError}</div>
          <button
            className="error-banner__close"
            onClick={() => setFileError(null)}
            aria-label="Zamknij"
          >
            ×
          </button>
        </div>
      )}

      <div className="or-divider">
        <span>lub wklej tekst</span>
      </div>

      <div className="textarea-wrap">
        <textarea
          className="textarea"
          placeholder="[00:00:12] Marek (PM): Spotykamy się dzisiaj, żeby omówić projekt…"
          value={props.transcript}
          onChange={(e) => {
            props.setTranscript(e.target.value);
            if (!props.fileName) props.setFileName('wklejone.txt');
          }}
          aria-label="Treść transkrypcji"
        />
        {props.transcript && (
          <div className="textarea__meta">
            <span>{wordCount.toLocaleString('pl-PL')} słów</span>
            <span>·</span>
            <span>{lineCount} linii</span>
            <span>·</span>
            <span>~{Math.max(1, Math.round(wordCount / 130))} min nagrania</span>
          </div>
        )}
      </div>

      <button className="link-btn" onClick={loadSample} type="button">
        <Icon.Mic className="link-btn__icon" />
        Wczytaj przykładową transkrypcję
      </button>

      <div className="docselect">
        <div className="docselect__head">
          <div className="pane__eyebrow">02 — Dokumenty do wygenerowania</div>
          <span className="docselect__count">
            {props.selectedDocs.length} / {DOC_TYPES.length}
          </span>
        </div>
        <ul className="docselect__list">
          {DOC_TYPES.map((d) => {
            const checked = props.selectedDocs.includes(d.id);
            return (
              <li
                key={d.id}
                className={`docselect__item ${checked ? 'is-on' : ''}`}
                onClick={() => props.toggleDoc(d.id)}
              >
                <span
                  className={`docselect__check ${checked ? 'is-on' : ''}`}
                  role="checkbox"
                  aria-checked={checked}
                >
                  {checked && <Icon.Check />}
                </span>
                <span className="docselect__name">
                  {d.name}
                  {d.recommended && (
                    <span className="docselect__rec">rekomendowany</span>
                  )}
                </span>
                <span className="docselect__est">{d.est}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="pane__footer">
        <div className="footer-row">
          <button
            className="btn btn--ghost"
            onClick={props.onOpenContext}
            title="Instrukcje i przykłady dla AI"
            type="button"
          >
            <Icon.Book className="btn__icon" />
            Kontekst AI
          </button>
          {isGenerating ? (
            <button
              className="btn btn--primary btn--grow"
              onClick={props.onCancel}
              type="button"
              title="Anuluj generowanie"
            >
              <span className="spinner" />
              Anuluj
            </button>
          ) : (
            <button
              className="btn btn--primary btn--grow"
              disabled={!props.transcript || props.selectedDocs.length === 0}
              onClick={props.onGenerate}
              type="button"
            >
              <Icon.Sparkle className="btn__icon" />
              Wygeneruj{' '}
              <span className="btn__count">{props.selectedDocs.length}</span>
            </button>
          )}
        </div>
        <div className="pane__footer-hint">
          {props.selectedDocs.length === 0
            ? 'Wybierz przynajmniej jeden typ dokumentu'
            : `Szacowany czas: ~${props.selectedDocs.length * 25}s · Claude Sonnet`}
        </div>
      </div>
    </div>
  );
}
