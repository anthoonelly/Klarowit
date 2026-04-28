'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from './icons';
import type { UserRole } from '@/lib/types';

interface ProjectRow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

interface TxRow {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface SessRow {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
}

interface Target {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tokenBalance: number;
  createdAt: string;
  projects: ProjectRow[];
  transactions: TxRow[];
  sessions: SessRow[];
}

interface Props {
  target: Target;
  isSelf: boolean;
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

export function AdminUserClient({ target, isSelf }: Props) {
  const router = useRouter();
  const [balance, setBalance] = useState(target.tokenBalance);
  const [grantAmount, setGrantAmount] = useState<string>('5');
  const [grantReason, setGrantReason] = useState('admin_grant');
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState<string | null>(null);

  const [setAmount, setSetAmount] = useState<string>(String(balance));
  const [setBusy, setSetBusy] = useState(false);
  const [setMsg, setSetMsg] = useState<string | null>(null);

  const [newPw, setNewPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const [role, setRole] = useState<UserRole>(target.role);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleMsg, setRoleMsg] = useState<string | null>(null);

  const grantTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantMsg(null);
    setGrantBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'grant',
          amount: parseInt(grantAmount, 10),
          reason: grantReason || 'admin_grant',
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setBalance(d.tokenBalance);
      setSetAmount(String(d.tokenBalance));
      setGrantMsg(`Saldo: ${d.tokenBalance} ⬩`);
      router.refresh();
    } catch (err) {
      setGrantMsg(err instanceof Error ? err.message : 'Błąd.');
    } finally {
      setGrantBusy(false);
    }
  };

  const setTokens = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetMsg(null);
    setSetBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          op: 'set',
          amount: parseInt(setAmount, 10),
          reason: 'manual_set',
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setBalance(d.tokenBalance);
      setSetMsg(`Ustawiono saldo: ${d.tokenBalance} ⬩`);
      router.refresh();
    } catch (err) {
      setSetMsg(err instanceof Error ? err.message : 'Błąd.');
    } finally {
      setSetBusy(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 8) {
      setPwMsg({ kind: 'err', text: 'Min. 8 znaków.' });
      return;
    }
    setPwBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newPw }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setPwMsg({
        kind: 'ok',
        text: 'Hasło zaktualizowane. Wszystkie sesje użytkownika zostały zakończone.',
      });
      setNewPw('');
      router.refresh();
    } catch (err) {
      setPwMsg({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Błąd.',
      });
    } finally {
      setPwBusy(false);
    }
  };

  const changeRole = async (newRole: UserRole) => {
    if (isSelf && newRole !== 'ADMIN') {
      setRoleMsg('Nie możesz zdegradować samego siebie.');
      return;
    }
    setRoleMsg(null);
    setRoleBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${target.id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `HTTP ${res.status}`);
      setRole(newRole);
      setRoleMsg(`Rola: ${newRole}`);
      router.refresh();
    } catch (err) {
      setRoleMsg(err instanceof Error ? err.message : 'Błąd.');
    } finally {
      setRoleBusy(false);
    }
  };

  return (
    <div className="account-grid">
      <section className="account-section">
        <h2 className="account-section__title">Saldo</h2>
        <div className="account-balance">
          <div className="account-balance__value">{balance}</div>
          <div className="account-balance__label">tokenów</div>
        </div>

        <form onSubmit={grantTokens} className="admin-form">
          <div className="admin-form__title">Doładuj (+/-)</div>
          <div className="admin-form__row">
            <input
              type="number"
              className="input"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder="np. 10 lub -5"
              required
            />
            <input
              type="text"
              className="input"
              value={grantReason}
              onChange={(e) => setGrantReason(e.target.value)}
              placeholder="powód"
              maxLength={120}
            />
            <button
              type="submit"
              className="btn btn--primary"
              disabled={grantBusy}
            >
              {grantBusy && <span className="spinner" />}
              Dodaj
            </button>
          </div>
          {grantMsg && <div className="admin-form__msg">{grantMsg}</div>}
        </form>

        <form onSubmit={setTokens} className="admin-form">
          <div className="admin-form__title">Ustaw na konkretną wartość</div>
          <div className="admin-form__row">
            <input
              type="number"
              className="input"
              value={setAmount}
              onChange={(e) => setSetAmount(e.target.value)}
              min={0}
              required
            />
            <button
              type="submit"
              className="btn btn--ghost"
              disabled={setBusy}
            >
              {setBusy && <span className="spinner" />}
              Ustaw
            </button>
          </div>
          {setMsg && <div className="admin-form__msg">{setMsg}</div>}
        </form>
      </section>

      <section className="account-section">
        <h2 className="account-section__title">Hasło</h2>
        <p className="account-section__hint">
          Reset wymusi ponowne zalogowanie — wszystkie aktywne sesje zostaną
          zakończone.
        </p>
        <form onSubmit={resetPassword} className="account-pw-form">
          <label className="auth-field">
            <span>Nowe hasło</span>
            <input
              type="text"
              className="input"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="min. 8 znaków"
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
            disabled={pwBusy || newPw.length < 8}
          >
            {pwBusy && <span className="spinner" />}
            Resetuj hasło
          </button>
        </form>

        <hr className="account-section__hr" />

        <h3 className="account-section__subtitle">Rola</h3>
        <div className="admin-form__row">
          <button
            type="button"
            className={`btn ${role === 'USER' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => changeRole('USER')}
            disabled={roleBusy || (isSelf && role === 'ADMIN')}
          >
            User
          </button>
          <button
            type="button"
            className={`btn ${role === 'ADMIN' ? 'btn--primary' : 'btn--ghost'}`}
            onClick={() => changeRole('ADMIN')}
            disabled={roleBusy}
          >
            Admin
          </button>
        </div>
        {roleMsg && <div className="admin-form__msg">{roleMsg}</div>}
        {isSelf && (
          <p className="account-section__hint">
            Nie możesz zdegradować swojego konta — w przeciwnym razie zostałbyś
            zablokowany w panelu admina.
          </p>
        )}
      </section>

      <section className="account-section account-section--wide">
        <h2 className="account-section__title">
          Projekty użytkownika ({target.projects.length})
        </h2>
        {target.projects.length === 0 ? (
          <p className="account-section__hint">Brak projektów.</p>
        ) : (
          <ul className="admin-proj-list">
            {target.projects.map((p) => (
              <li key={p.id} className="admin-proj-row">
                <Link href={`/projects/${p.id}`} className="admin-proj-row__name">
                  {p.name}
                </Link>
                <span className="admin-proj-row__meta">
                  {p.documentCount}{' '}
                  {p.documentCount === 1 ? 'dokument' : 'dokumentów'} · ostatnio{' '}
                  {fmt(p.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="account-section account-section--wide">
        <h2 className="account-section__title">
          Historia operacji ({target.transactions.length})
        </h2>
        {target.transactions.length === 0 ? (
          <p className="account-section__hint">Brak operacji.</p>
        ) : (
          <ul className="tx-list">
            {target.transactions.map((t) => (
              <li key={t.id} className="tx-row">
                <div className="tx-row__icon" aria-hidden>
                  {t.amount > 0 ? <Icon.Plus /> : <Icon.Sparkle />}
                </div>
                <div className="tx-row__main">
                  <div className="tx-row__reason">{t.reason}</div>
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

      <section className="account-section account-section--wide">
        <h2 className="account-section__title">
          Aktywne sesje ({target.sessions.length})
        </h2>
        {target.sessions.length === 0 ? (
          <p className="account-section__hint">Brak aktywnych sesji.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User-Agent</th>
                <th>IP</th>
                <th>Założono</th>
                <th>Wygasa</th>
              </tr>
            </thead>
            <tbody>
              {target.sessions.map((s) => (
                <tr key={s.id}>
                  <td className="admin-table__truncate" title={s.userAgent ?? ''}>
                    {s.userAgent ?? '—'}
                  </td>
                  <td>{s.ipAddress ?? '—'}</td>
                  <td>{fmt(s.createdAt)}</td>
                  <td>{fmt(s.expiresAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
