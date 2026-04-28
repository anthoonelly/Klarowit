'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';
import { ThemeToggle } from './theme-toggle';
import type { GenerationStatus, SessionUser } from '@/lib/types';

interface TopBarProps {
  status?: GenerationStatus;
  contextSummary?: string;
  onOpenContext?: () => void;
  user: SessionUser;
  tokenBalance: number;
}

const NAV = [
  { href: '/workspace', label: 'Workspace' },
  { href: '/projects', label: 'Projekty' },
  { href: '/account', label: 'Konto' },
];

export function TopBar({
  status,
  contextSummary,
  onOpenContext,
  user,
  tokenBalance,
}: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const initials = (user.name || user.email)
    .split(/\s+|@/)
    .map((s) => s.charAt(0).toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  const handleSignout = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  const isLow = tokenBalance < 3;

  const nav = [...NAV];
  if (user.role === 'ADMIN') nav.push({ href: '/admin', label: 'Admin' });

  return (
    <header className="topbar">
      <Link href="/workspace" className="topbar__brand" aria-label="Memoist — workspace">
        <div className="brand__mark" aria-hidden>
          <svg viewBox="0 0 32 32" width="22" height="22">
            <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M9 16h14M16 9v14" stroke="currentColor" strokeWidth="1.2" />
            <circle cx="16" cy="16" r="3" fill="currentColor" />
          </svg>
        </div>
        <div className="brand__text">
          <div className="brand__name">Memoist</div>
          <div className="brand__tag">transcript → document</div>
        </div>
      </Link>

      <nav className="topbar__nav" aria-label="Nawigacja główna">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={isActive(n.href) ? 'is-active' : undefined}
            aria-current={isActive(n.href) ? 'page' : undefined}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <div className="topbar__right">
        {onOpenContext && (
          <button
            className="ctx-chip"
            onClick={onOpenContext}
            title="Kontekst AI — instrukcje i wzorce"
            type="button"
          >
            <Icon.Book className="ctx-chip__icon" />
            <span>Kontekst</span>
            {contextSummary && (
              <>
                <span className="ctx-chip__sep">·</span>
                <span className="ctx-chip__count">{contextSummary}</span>
              </>
            )}
          </button>
        )}

        <Link
          href="/account"
          className={`token-pill ${isLow ? 'token-pill--low' : ''}`}
          title={isLow ? 'Niskie saldo — uzupełnij wkrótce' : 'Saldo tokenów'}
        >
          <Icon.Sparkle className="token-pill__icon" />
          <span className="token-pill__num">{tokenBalance}</span>
          <span className="token-pill__label">
            {tokenBalance === 1 ? 'token' : 'tokenów'}
          </span>
        </Link>

        {status && (
          <div
            className={`status-pill status-pill--${status}`}
            role="status"
            aria-live="polite"
          >
            <span className="status-pill__dot" aria-hidden />
            {status === 'idle' && 'Gotowy'}
            {status === 'generating' && 'Generuję'}
            {status === 'done' && 'Ukończono'}
            {status === 'error' && 'Błąd'}
          </div>
        )}

        <ThemeToggle />

        <div className="user-menu" ref={menuRef}>
          <button
            className="avatar avatar--button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            type="button"
            title={user.email}
          >
            {initials || '·'}
          </button>
          {menuOpen && (
            <div className="user-menu__dropdown" role="menu">
              <div className="user-menu__head">
                <div className="user-menu__name">{user.name || user.email}</div>
                {user.name && (
                  <div className="user-menu__email">{user.email}</div>
                )}
                {user.role === 'ADMIN' && (
                  <span className="user-menu__role">administrator</span>
                )}
              </div>
              <Link
                href="/account"
                className="user-menu__item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Konto i tokeny
              </Link>
              <Link
                href="/projects"
                className="user-menu__item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Moje projekty
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  className="user-menu__item"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  Panel admina
                </Link>
              )}
              <div className="user-menu__divider" />
              <button
                className="user-menu__item user-menu__item--danger"
                role="menuitem"
                onClick={handleSignout}
                type="button"
              >
                Wyloguj się
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
