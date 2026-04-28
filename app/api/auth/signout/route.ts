import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  destroySessionByJti,
  verifySessionJWT,
} from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    const payload = await verifySessionJWT(token);
    if (payload?.jti) {
      await destroySessionByJti(payload.jti);
    }
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
  return res;
}
