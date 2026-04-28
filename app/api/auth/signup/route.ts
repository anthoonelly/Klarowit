import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  SESSION_COOKIE,
  createSession,
  hashPassword,
  sessionCookieAttrs,
  validateEmail,
  validatePassword,
} from '@/lib/auth';

export const runtime = 'nodejs';

interface SignupBody {
  email?: string;
  password?: string;
  name?: string;
}

export async function POST(req: NextRequest) {
  let body: SignupBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Niepoprawny JSON.' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';
  const name = (body.name ?? '').trim() || null;

  const emailErr = validateEmail(email);
  if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 });

  const pwErr = validatePassword(password);
  if (pwErr) return NextResponse.json({ error: pwErr }, { status: 400 });

  // Check if email already used
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: 'Konto z tym adresem email już istnieje.' },
      { status: 409 }
    );
  }

  // ADMIN_EMAIL → first signup gets ADMIN role
  const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const role = adminEmail && email === adminEmail ? 'ADMIN' : 'USER';

  const passwordHash = await hashPassword(password);
  const giftAmount = parseInt(process.env.SIGNUP_TOKEN_GIFT ?? '5', 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
      tokenBalance: Math.max(0, giftAmount),
      transactions:
        giftAmount > 0
          ? {
              create: {
                amount: giftAmount,
                reason: 'signup_gift',
              },
            }
          : undefined,
    },
    select: { id: true, email: true, name: true, role: true, tokenBalance: true },
  });

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

  const res = NextResponse.json({ user });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieAttrs(expiresAt));
  return res;
}
