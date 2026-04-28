'use client';

import { useState } from 'react';
import { Icon } from './icons';
import type { SessionUser } from '@/lib/types';

interface Tx {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface Props {
  user: SessionUser;
  transactions: Tx[];
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function reasonLabel(r: string): string {
  if (r === 'signup_gift') return 'Bonus powitalny';
  if (r === 'admin_grant') return 'Doładowanie od admina';
  if (r.startsWith('admin_set:')) return `Korekta admina (${r.slice(10)})`;
  if (r.startsWith('generation:')) return `Generacja: ${r.slice(11)}`;
  if (r.startsWith('refund:generation:'))
    return `Zwrot za nieudaną generację: ${r.slice(18)}`;
  if (r === 'purchase') return 'Zakup tokenów';
  return r;
}

export function AccountClient({ user, transactions }: Props) {
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw.length < 8) {
      setPwMsg({ kind: 'err', text: 'Hasło musi mieć min. 8 znaków.' });
      return;
    }
    setPwLoading(true);
    setPwMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPw }),
      });
      // Note: this endpoint requires ADMIN. Regular users can't reset
      // their own password through this flow yet — we just show appropriate msg.
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setPwMsg({ kind: 'ok', text: 'Hasło zaktualizowane. Zaloguj się ponownie.' });
      setNewPw('');
    } catch (err) {
      setPwMsg({
        kind: 'err',
        text:
          err instanceof Error
            ? err.message
            : 'Nie udało się zmienić hasła. Skontaktuj się z administratorem.',
      });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="account-grid">
      <section className="account-section">
        <h2 className="account-section__title">Saldo tokenów</h2>
        <div className="account-balance">
          <div className="account-balance__value">{user.tokenBalance}</div>
          <div className="account-balance__label">tokenów</div>
        </div>
        <p className="account-section__hint">
          1 token ≈ 1 prosty dokument · 2 tokeny ≈ standardowy · 3 tokeny ≈
          dokumentacja B+R. Płatne doładowania przygotowujemy — na razie napisz
          do administratora.
        </p>
        <a href="mailto:support@example.com" className="btn btn--ghost btn--small">
          Skontaktuj się z administratorem
        </a>
      </section>

      <section className="account-section">
        <h2 className="account-section__title">Zmień hasło</h2>
        {user.role !== 'ADMIN' && (
          <p className="account-section__hint" style={{ marginBottom: 12 }}>
            Aby zresetować swoje hasło, skontaktuj się z administratorem —
            samoobsługowy reset przygotowujemy.
          </p>
        )}
        {user.role === 'ADMIN' && (
          <form onSubmit={changePassword} className="account-pw-form">
            <label className="auth-field">
              <span>Nowe hasło</span>
              <input
                type="password"
                className="input"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
              />
            </label>
            {pwMsg && (
              <div
                className={`pw-msg pw-msg--${pwMsg.kind}`}
                role={pwMsg.kind === 'err' ? 'alert' : 'status'}
              >
                {pwMsg.text}
              </div>
            )}
            <button
              type="submit"
              className="btn btn--primary"
              disabled={pwLoading || newPw.length < 8}
            >
              {pwLoading && <span className="spinner" />}
              Zaktualizuj hasło
            </button>
          </form>
        )}
      </section>

      <section className="account-section account-section--wide">
        <h2 className="account-section__title">Historia operacji</h2>
        {transactions.length === 0 ? (
          <p className="account-section__hint">
            Brak operacji. Przy pierwszej generacji pojawią się tu obciążenia.
          </p>
        ) : (
          <ul className="tx-list">
            {transactions.map((t) => (
              <li key={t.id} className="tx-row">
                <div className="tx-row__icon" aria-hidden>
                  {t.amount > 0 ? (
                    <Icon.Plus />
                  ) : (
                    <Icon.Sparkle />
                  )}
                </div>
                <div className="tx-row__main">
                  <div className="tx-row__reason">{reasonLabel(t.reason)}</div>
                  <div className="tx-row__date">{fmt(t.createdAt)}</div>
                </div>
                <div
                  className={`tx-row__amount ${
                    t.amount > 0 ? 'tx-row__amount--pos' : 'tx-row__amount--neg'
                  }`}
                >
                  {t.amount > 0 ? '+' : ''}
                  {t.amount} ⬩
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
