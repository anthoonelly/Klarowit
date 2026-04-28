import type { DocTypeId } from './types';
import { prisma } from './db';

/**
 * Koszt tokenów dla każdego typu dokumentu.
 *
 * Logika kosztu:
 *  - Proste dokumenty (brief, harmo, ryzyka): 1 token
 *  - Standardowe (opis, budzet, sow): 2 tokeny
 *  - Złożone (br — wymaga głębszej argumentacji prawnej): 3 tokeny
 *
 * 1 token to mniej-więcej koszt który ma pokryć generację plus marżę.
 * Realny koszt API gpt-5.4 dla dokumentu to ~0.01-0.05 USD.
 */
export const TOKEN_COSTS: Record<DocTypeId, number> = {
  brief: 1,
  harmo: 1,
  ryzyka: 1,
  opis: 2,
  budzet: 2,
  sow: 2,
  br: 3,
};

export function tokenCostFor(docType: DocTypeId): number {
  return TOKEN_COSTS[docType] ?? 1;
}

export function totalTokenCost(docTypes: DocTypeId[]): number {
  return docTypes.reduce((sum, id) => sum + tokenCostFor(id), 0);
}

/**
 * Atomically deduct tokens from a user, recording a transaction.
 * Throws if balance is insufficient.
 */
export async function deductTokens(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  if (amount <= 0) {
    throw new Error('Kwota musi być dodatnia.');
  }

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { tokenBalance: true },
    });
    if (!user) throw new Error('Użytkownik nie istnieje.');
    if (user.tokenBalance < amount) {
      throw new Error(
        `Niewystarczające saldo tokenów (potrzeba ${amount}, masz ${user.tokenBalance}).`
      );
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { tokenBalance: { decrement: amount } },
      select: { tokenBalance: true },
    });

    await tx.transaction.create({
      data: {
        userId,
        amount: -amount,
        reason,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });

    return { newBalance: updated.tokenBalance };
  });
}

/**
 * Refund tokens (used when generation fails after deduction).
 */
export async function refundTokens(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  if (amount <= 0) {
    throw new Error('Kwota musi być dodatnia.');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: amount } },
      select: { tokenBalance: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        amount: amount,
        reason: `refund:${reason}`,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
    return { newBalance: updated.tokenBalance };
  });
}

/**
 * Add tokens (admin grant, signup gift, purchase).
 */
export async function grantTokens(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, unknown>
): Promise<{ newBalance: number }> {
  if (amount <= 0) {
    throw new Error('Kwota musi być dodatnia.');
  }
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { tokenBalance: { increment: amount } },
      select: { tokenBalance: true },
    });
    await tx.transaction.create({
      data: { userId, amount, reason, metadata: metadata as object | undefined },
    });
    return { newBalance: updated.tokenBalance };
  });
}
