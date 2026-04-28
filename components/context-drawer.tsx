'use client';

import { useEffect, useState } from 'react';
import { Icon } from './icons';
import type { ContextExample } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  instructions: string;
  setInstructions: (s: string) => void;
  examples: ContextExample[];
  setExamples: (e: ContextExample[]) => void;
}

type DrawerTab = 'instructions' | 'examples';

export function ContextDrawer(props: Props) {
  const [tab, setTab] = useState<DrawerTab>('instructions');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name: string; body: string }>({
    name: '',
    body: '',
  });

  useEffect(() => {
    if (!props.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') props.onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [props.open, props.onClose]);

  const startNew = () => {
    setEditingId('__new__');
    setDraft({ name: '', body: '' });
  };

  const startEdit = (ex: ContextExample) => {
    setEditingId(ex.id);
    setDraft({ name: ex.name, body: ex.body });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ name: '', body: '' });
  };

  const saveEdit = () => {
    if (!draft.name.trim() || !draft.body.trim()) return;
    if (editingId === '__new__') {
      const next: ContextExample = {
        id: `ex-${Date.now()}`,
        name: draft.name.trim(),
        body: draft.body.trim(),
      };
      props.setExamples([...props.examples, next]);
    } else if (editingId) {
      props.setExamples(
        props.examples.map((e) =>
          e.id === editingId
            ? { ...e, name: draft.name.trim(), body: draft.body.trim() }
            : e
        )
      );
    }
    cancelEdit();
  };

  const removeExample = (id: string) => {
    props.setExamples(props.examples.filter((e) => e.id !== id));
  };

  return (
    <div
      className={`drawer ${props.open ? 'is-open' : ''}`}
      aria-hidden={!props.open}
    >
      <div className="drawer__scrim" onClick={props.onClose} />
      <aside
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ctx-title"
      >
        <div className="drawer__head">
          <div>
            <div className="pane__eyebrow">Konfiguracja AI</div>
            <h2 className="drawer__title" id="ctx-title">
              Kontekst
            </h2>
          </div>
          <button
            className="icon-btn"
            onClick={props.onClose}
            aria-label="Zamknij"
            type="button"
          >
            <Icon.Close />
          </button>
        </div>

        <div className="drawer__tabs" role="tablist">
          <button
            className={`drawer__tab ${tab === 'instructions' ? 'is-active' : ''}`}
            onClick={() => setTab('instructions')}
            role="tab"
            aria-selected={tab === 'instructions'}
            type="button"
          >
            Instrukcje
          </button>
          <button
            className={`drawer__tab ${tab === 'examples' ? 'is-active' : ''}`}
            onClick={() => setTab('examples')}
            role="tab"
            aria-selected={tab === 'examples'}
            type="button"
          >
            Przykłady · wzorce
            <span className="drawer__tab-count">{props.examples.length}</span>
          </button>
        </div>

        <div className="drawer__content">
          {tab === 'instructions' && (
            <>
              <p className="drawer__copy">
                Te wskazówki będą dołączane do każdej generacji jako system
                prompt. Zdefiniuj zasady stylistyczne, ton, jak ma traktować
                liczby i nazwiska, jakich zwrotów unikać.
              </p>
              <textarea
                className="textarea drawer__textarea"
                value={props.instructions}
                onChange={(e) => props.setInstructions(e.target.value)}
                placeholder="np. „Pisz formalnym językiem, cytuj kwoty zgodnie z transkrypcją, używaj nawiasów [domniemane] dla luk."
                aria-label="Instrukcje globalne"
              />
              <div className="drawer__hint">
                <Icon.Sparkle className="drawer__hint-icon" />
                <span>
                  Wskazówka: instrukcje są zapisywane lokalnie w przeglądarce —
                  nie wysyłamy ich nigdzie poza generację.
                </span>
              </div>
            </>
          )}

          {tab === 'examples' && (
            <>
              <p className="drawer__copy">
                Wzorce / szablony firmowe które AI ma naśladować strukturalnie i
                stylistycznie. Używaj 1–3 najbardziej reprezentatywnych — więcej
                spowalnia generację bez wzrostu jakości.
              </p>

              {editingId ? (
                <div className="example-edit">
                  <div className="presets__label">
                    {editingId === '__new__'
                      ? 'Nowy wzorzec'
                      : 'Edycja wzorca'}
                  </div>
                  <input
                    className="input"
                    placeholder='Nazwa wzorca (np. „Wzorzec — opis projektu")'
                    value={draft.name}
                    onChange={(e) =>
                      setDraft({ ...draft, name: e.target.value })
                    }
                    autoFocus
                  />
                  <textarea
                    className="textarea drawer__textarea"
                    placeholder="Wklej treść wzorca / szablonu…"
                    value={draft.body}
                    onChange={(e) =>
                      setDraft({ ...draft, body: e.target.value })
                    }
                  />
                  <div className="example-edit__actions">
                    <button
                      className="btn btn--ghost btn--small"
                      onClick={cancelEdit}
                      type="button"
                    >
                      Anuluj
                    </button>
                    <button
                      className="btn btn--primary btn--small"
                      onClick={saveEdit}
                      disabled={!draft.name.trim() || !draft.body.trim()}
                      type="button"
                    >
                      Zapisz
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {props.examples.length === 0 ? (
                    <div className="example-empty">
                      Brak zapisanych wzorców. Dodaj pierwszy.
                    </div>
                  ) : (
                    <div className="example-list">
                      {props.examples.map((ex) => (
                        <div className="example-item" key={ex.id}>
                          <div className="example-item__head">
                            <div className="example-item__name">{ex.name}</div>
                            <div className="example-item__actions">
                              <button
                                className="link-btn"
                                onClick={() => startEdit(ex)}
                                type="button"
                              >
                                Edytuj
                              </button>
                              <button
                                className="link-btn link-btn--danger"
                                onClick={() => removeExample(ex.id)}
                                type="button"
                              >
                                Usuń
                              </button>
                            </div>
                          </div>
                          <pre className="example-item__body">{ex.body}</pre>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    className="btn btn--outline btn--small"
                    onClick={startNew}
                    style={{ alignSelf: 'flex-start' }}
                    type="button"
                  >
                    <Icon.Plus className="btn__icon" />
                    Dodaj nowy wzorzec
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
