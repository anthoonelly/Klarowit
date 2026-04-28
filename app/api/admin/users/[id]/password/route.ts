import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { hashPassword, validatePassword } from '@/lib/auth';

export const runtime = 'nodejs';

interface Body {
  newPassword?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Wymagane zalogowanie.' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Niepoprawny JSON.' }, { status: 400 });
  }

  const newPassword = body.newPassword ?? '';
  const err = validatePassword(newPassword);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Użytkownik nie istnieje.' }, { status: 404 });
  }

  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: target.id },
    data: { passwordHash },
  });

  // Optional: kill all sessions of this user so they must re-login.
  await prisma.session.deleteMany({ where: { userId: target.id } });

  return NextResponse.json({ ok: true });
}
