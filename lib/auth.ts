import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';
import type { Role } from '@prisma/client';
import { prisma } from './db';

// ─── Constants ──────────────────────────────────────────────────────────────
export const SESSION_COOKIE = 'memoist_session';
const SESSION_DAYS = 30;
const BCRYPT_ROUNDS = 10;

function getAuthSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      'AUTH_SECRET is not set or too short (min 16 chars). Generate: openssl rand -base64 32'
    );
  }
  return new TextEncoder().encode(s);
}

// ─── Passwords ──────────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── JWT ────────────────────────────────────────────────────────────────────
export interface JWTPayload {
  sub: string; // user id
  jti: string; // session jti
  role: Role;
  email: string;
}

export async function signSessionJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ role: payload.role, email: payload.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getAuthSecret());
}

export async function verifySessionJWT(
  token: string
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (!payload.sub || !payload.jti || typeof payload.role !== 'string') {
      return null;
    }
    return {
      sub: payload.sub,
      jti: payload.jti as string,
      role: payload.role as Role,
      email: (payload.email as string) ?? '',
    };
  } catch {
    return null;
  }
}

// ─── Sessions ───────────────────────────────────────────────────────────────
export interface CreateSessionOptions {
  userId: string;
  email: string;
  role: Role;
  userAgent?: string | null;
  ipAddress?: string | null;
}

export async function createSession(opts: CreateSessionOptions) {
  const jti = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      jti,
      userId: opts.userId,
      userAgent: opts.userAgent ?? null,
      ipAddress: opts.ipAddress ?? null,
      expiresAt,
    },
  });

  const token = await signSessionJWT({
    sub: opts.userId,
    jti,
    role: opts.role,
    email: opts.email,
  });

  return { token, expiresAt, jti };
}

export async function destroySessionByJti(jti: string): Promise<void> {
  await prisma.session
    .delete({ where: { jti } })
    .catch(() => {
      /* already gone — ignore */
    });
}

/**
 * Cleanup helper: delete expired sessions. Call from a cron or admin tool.
 */
export async function purgeExpiredSessions(): Promise<number> {
  const res = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return res.count;
}

// ─── Cookie attrs ───────────────────────────────────────────────────────────
export function sessionCookieAttrs(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

// ─── Validation helpers ─────────────────────────────────────────────────────
export function validateEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return 'Adres email jest wymagany.';
  if (trimmed.length > 255) return 'Adres email jest za długi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return 'Adres email jest niepoprawny.';
  }
  return null;
}

export function validatePassword(pw: string): string | null {
  if (!pw) return 'Hasło jest wymagane.';
  if (pw.length < 8) return 'Hasło musi mieć min. 8 znaków.';
  if (pw.length > 128) return 'Hasło jest za długie (max 128 znaków).';
  return null;
}
