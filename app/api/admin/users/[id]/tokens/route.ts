import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { grantTokens } from '@/lib/tokens';

export const runtime = 'nodejs';

interface Body {
  /** Operacja: 'grant' = doda; 'set' = ustawi na konkretną wartość. */
  op?: 'grant' | 'set';
  amount?: number;
  reason?: string;
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

  const op = body.op ?? 'grant';
  const amount = body.amount;
  const reason = (body.reason ?? '').trim() || 'admin_grant';

  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return NextResponse.json({ error: 'Pole `amount` musi być liczbą.' }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, tokenBalance: true },
  });
  if (!target) {
    return NextResponse.json({ error: 'Użytkownik nie istnieje.' }, { status: 404 });
  }

  if (op === 'grant') {
    if (amount === 0) {
      return NextResponse.json({ error: 'Kwota musi być różna od zera.' }, { status: 400 });
    }
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: target.id },
        data: { tokenBalance: { increment: amount } },
        select: { tokenBalance: true },
      });
      await tx.transaction.create({
        data: {
          userId: target.id,
          amount,
          reason,
          metadata: { adminId: session.id, adminEmail: session.email },
        },
      });
      return updated;
    });
    return NextResponse.json({ tokenBalance: result.tokenBalance });
  }

  if (op === 'set') {
    if (amount < 0) {
      return NextResponse.json(
        { error: 'Saldo nie może być ujemne.' },
        { status: 400 }
      );
    }
    const delta = amount - target.tokenBalance;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: target.id },
        data: { tokenBalance: amount },
        select: { tokenBalance: true },
      });
      if (delta !== 0) {
        await tx.transaction.create({
          data: {
            userId: target.id,
            amount: delta,
            reason: `admin_set:${reason}`,
            metadata: {
              adminId: session.id,
              adminEmail: session.email,
              previousBalance: target.tokenBalance,
              newBalance: amount,
            },
          },
        });
      }
      return updated;
    });
    return NextResponse.json({ tokenBalance: result.tokenBalance });
  }

  return NextResponse.json({ error: 'Nieznana operacja.' }, { status: 400 });
}
