import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionJWT } from './auth';
import { prisma } from './db';
import type { Role } from '@prisma/client';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  tokenBalance: number;
}

/**
 * Read the current user from the session cookie. Returns null if no valid
 * session. Also validates that the session jti is still in the database
 * (allows admin / user to revoke sessions).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionJWT(token);
  if (!payload) return null;

  // Verify session is still active in DB
  const session = await prisma.session.findUnique({
    where: { jti: payload.jti },
    select: { id: true, expiresAt: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tokenBalance: true,
    },
  });
  return user;
}

/**
 * Throws a Response if no session — use in route handlers / server components
 * that require auth.
 */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Response(JSON.stringify({ error: 'Wymagane zalogowanie.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (user.role !== 'ADMIN') {
    throw new Response(JSON.stringify({ error: 'Brak uprawnień.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return user;
}
