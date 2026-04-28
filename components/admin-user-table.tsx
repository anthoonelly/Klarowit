'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { AdminUserRow } from '@/lib/types';

interface Props {
  users: AdminUserRow[];
  currentUserId: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function AdminUserTable({ users, currentUserId }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false)
    );
  }, [users, query]);

  return (
    <div className="admin-table-wrap">
      <div className="admin-table__toolbar">
        <input
          type="search"
          className="input"
          placeholder="Szukaj po emailu lub nazwie…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <span className="admin-table__count">
          {filtered.length} z {users.length}
        </span>
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Użytkownik</th>
            <th>Rola</th>
            <th className="admin-table__num">Saldo</th>
            <th className="admin-table__num">Projektów</th>
            <th>Założono</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((u) => {
            const isMe = u.id === currentUserId;
            return (
              <tr key={u.id}>
                <td>
                  <div className="admin-table__user">
                    <span className="admin-table__name">
                      {u.name || '—'}
                      {isMe && (
                        <span className="admin-table__self">to ty</span>
                      )}
                    </span>
                    <span className="admin-table__email">{u.email}</span>
                  </div>
                </td>
                <td>
                  <span
                    className={`admin-table__role admin-table__role--${u.role.toLowerCase()}`}
                  >
                    {u.role === 'ADMIN' ? 'admin' : 'user'}
                  </span>
                </td>
                <td className="admin-table__num">
                  <strong>{u.tokenBalance}</strong> ⬩
                </td>
                <td className="admin-table__num">{u.projectCount}</td>
                <td>{fmt(u.createdAt)}</td>
                <td>
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="btn btn--ghost btn--small"
                  >
                    Zarządzaj →
                  </Link>
                </td>
              </tr>
            );
          })}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="admin-table__empty">
                Brak użytkowników pasujących do zapytania.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
