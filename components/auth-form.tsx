'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

interface Props {
  mode: 'signin' | 'signup';
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/workspace';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...(mode === 'signup' && name ? { name } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd.');
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === 'signup';

  return (
    <div className="auth-card">
      <div className="auth-card__head">
        <div className="brand__mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="22" height="22">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9 16h14M16 9v14" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3" fill="currentColor" />
          </svg>
        </div>
        <div className="auth-card__brand">Memoist</div>
        <h1 className="auth-card__title">
          {isSignup ? 'Załóż konto' : 'Zaloguj się'}
        </h1>
        <p className="auth-card__sub">
          {isSignup
            ? 'Z transkrypcji do dokumentów. 5 tokenów na start.'
            : 'Wróć do swoich projektów i transkrypcji.'}
        </p>
      </div>

      <form onSubmit={submit} className="auth-form">
        {isSignup && (
          <label className="auth-field">
            <span>Imię (opcjonalne)</span>
            <input
              type="text"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              maxLength={120}
            />
          </label>
        )}

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            maxLength={255}
          />
        </label>

        <label className="auth-field">
          <span>Hasło</span>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={8}
            maxLength={128}
          />
          {isSignup && (
            <small className="auth-hint">Min. 8 znaków.</small>
          )}
        </label>

        {error && (
          <div className="error-banner" role="alert" style={{ marginBottom: 4 }}>
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={loading || !email || !password}
        >
          {loading ? <span className="spinner" /> : null}
          {isSignup ? 'Załóż konto' : 'Zaloguj się'}
        </button>
      </form>

      <div className="auth-card__foot">
        {isSignup ? (
          <>
            Masz już konto?{' '}
            <Link href="/signin" className="auth-card__link">
              Zaloguj się
            </Link>
          </>
        ) : (
          <>
            Nie masz konta?{' '}
            <Link href="/signup" className="auth-card__link">
              Załóż konto
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
