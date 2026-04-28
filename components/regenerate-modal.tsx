'use client';

import { useEffect, useState } from 'react';

const PRESETS = [
  'Bardziej formalny ton',
  'Krótsza wersja (max 1 strona)',
  'Więcej liczb i konkretów',
  'Mniej żargonu technicznego',
  'Mocniejsze podkreślenie nowości B+R',
];

interface Props {
  open: boolean;
  docTitle: string;
  currentVersion: number;
  onClose: () => void;
  onConfirm: (note: string) => void;
}

export function RegenerateModal({
  open,
  docTitle,
  currentVersion,
  onClose,
  onConfirm,
}: Props) {
  const [note, setNote] = useState('');

  // Reset and focus when opened
  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(note.trim());
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="regen-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal__dialog">
        <div className="modal__head">
          <div>
            <div className="modal__eyebrow">
              Regeneracja · v{currentVersion}.0 → v{currentVersion + 1}.0
            </div>
            <h3 className="modal__title" id="regen-title">
              {docTitle}
            </h3>
          </div>
        </div>
        <p className="modal__copy">
          Co poprawić w tej wersji? Możesz dodać własne uwagi lub kliknąć
          jeden z gotowych presetów.
        </p>

        <textarea
          className="textarea modal__textarea"
          placeholder="np. „Skróć streszczenie i wzmocnij argumenty B+R"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus
        />

        <div className="presets">
          <div className="presets__label">Szybkie presety</div>
          <div className="presets__chips">
            {PRESETS.map((p) => (
              <button
                key={p}
                className="chip"
                onClick={() => setNote((curr) => (curr ? `${curr} · ${p}` : p))}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Anuluj
          </button>
          <button
            className="btn btn--primary"
            onClick={handleConfirm}
            type="button"
          >
            Generuj v{currentVersion + 1}.0
          </button>
        </div>
      </div>
    </div>
  );
}
