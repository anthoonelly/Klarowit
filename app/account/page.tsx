import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { TopBar } from '@/components/topbar';
import { AccountClient } from '@/components/account-client';

export const metadata = {
  title: 'Konto · Memoist',
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin?next=/account');

  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="app">
      <TopBar user={user} tokenBalance={user.tokenBalance} />

      <main className="page">
        <div className="page__head">
          <div>
            <div className="page__eyebrow">Konto</div>
            <h1 className="page__title">{user.name || user.email}</h1>
            <div className="page__sub">{user.email}</div>
          </div>
        </div>

        <AccountClient
          user={user}
          transactions={transactions.map((t: any) => ({
            id: t.id,
            amount: t.amount,
            reason: t.reason,
            createdAt: t.createdAt.toISOString(),
          }))}
        />
      </main>
    </div>
  );
}
