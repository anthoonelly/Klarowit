import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';

interface Body {
  role?: 'USER' | 'ADMIN';
}

export async function PATCH(
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

  if (body.role !== 'USER' && body.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Pole `role` musi być USER lub ADMIN.' },
      { status: 400 }
    );
  }

  // Don't let admin demote self (would lock self out of admin)
  if (params.id === session.id && body.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Nie możesz zdegradować samego siebie.' },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: body.role },
    select: { id: true, role: true },
  });

  return NextResponse.json({ user: updated });
}
