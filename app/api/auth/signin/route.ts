import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  SESSION_COOKIE,
  createSession,
  sessionCookieAttrs,
  verifyPassword,
} from '@/lib/auth';

export const runtime = 'nodejs';

interface SigninBody {
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  let body: SigninBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Niepoprawny JSON.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Podaj email i hasło.' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tokenBalance: true,
      passwordHash: true,
    },
  });

  // Use a constant-time-ish path: always do a hash compare even if user is null,
  // to avoid leaking which emails exist via timing.
  const dummyHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8E1Wgj6m5mZpKSJZvYoP1wSk0L4ZpC';
  const ok = await verifyPassword(
    password,
    user?.passwordHash ?? dummyHash
  );

  if (!user || !ok) {
    return NextResponse.json(
      { error: 'Nieprawidłowy email lub hasło.' },
      { status: 401 }
    );
  }

  const ua = req.headers.get('user-agent');
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  const { token, expiresAt } = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    userAgent: ua,
    ipAddress: ip,
  });

  const res = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tokenBalance: user.tokenBalance,
    },
  });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieAttrs(expiresAt));
  return res;
}
