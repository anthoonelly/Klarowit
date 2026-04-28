'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Icon } from './icons';

interface Props {
  open: boolean;
  required: number;
  balance: number;
  onClose: () => void;
  isAdmin: boolean;
}

export function InsufficientTokensModal({
  open,
  required,
  balance,
  onClose,
  isAdmin,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const missing = Math.max(0, required - balance);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--narrow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insufficient-title"
      >
        <button
          className="modal__close"
          onClick={onClose}
          aria-label="Zamknij"
          type="button"
        >
          ×
        </button>
        <div className="modal__icon-circle">
          <Icon.AlertTriangle />
        </div>
        <h2 className="modal__title" id="insufficient-title">
          Niewystarczające saldo
        </h2>
        <p className="modal__copy">
          Aby wygenerować wybrane dokumenty potrzebujesz{' '}
          <strong>{required} {required === 1 ? 'tokena' : 'tokenów'}</strong>,
          a masz <strong>{balance}</strong>. Brakuje{' '}
          <strong>{missing}</strong>.
        </p>
        <div className="modal__balance-row">
          <div className="modal__balance">
            <div className="modal__balance-label">Potrzeba</div>
            <div className="modal__balance-value">{required} ⬩</div>
          </div>
          <div className="modal__balance">
            <div className="modal__balance-label">Saldo</div>
            <div className="modal__balance-value">{balance} ⬩</div>
          </div>
          <div className="modal__balance modal__balance--warn">
            <div className="modal__balance-label">Brakuje</div>
            <div className="modal__balance-value">{missing} ⬩</div>
          </div>
        </div>
        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onClose} type="button">
            Zamknij
          </button>
          {isAdmin ? (
            <Link href="/admin" className="btn btn--primary">
              Otwórz panel admina
            </Link>
          ) : (
            <Link href="/account" className="btn btn--primary">
              Doładuj saldo
            </Link>
          )}
        </div>
        {!isAdmin && (
          <p className="modal__foot">
            Doładowanie tokenów odbywa się aktualnie przez administratora —
            napisz na <a href="mailto:support@example.com">support@example.com</a>
            , aby uzupełnić saldo.
          </p>
        )}
      </div>
    </div>
  );
}
