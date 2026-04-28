import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { TopBar } from '@/components/topbar';
import { AdminUserTable } from '@/components/admin-user-table';

export const metadata = {
  title: 'Admin · Memoist',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin?next=/admin');
  if (user.role !== 'ADMIN') redirect('/workspace');

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      tokenBalance: true,
      createdAt: true,
      _count: { select: { projects: true } },
    },
  });

  const rows = users.map((u: any) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    tokenBalance: u.tokenBalance,
    createdAt: u.createdAt.toISOString(),
    projectCount: u._count.projects,
  }));

  // Quick stats
  const totalTokens = users.reduce((s: number, u: any) => s + u.tokenBalance, 0);
  const adminCount = users.filter((u: any) => u.role === 'ADMIN').length;

  return (
    <div className="app">
      <TopBar user={user} tokenBalance={user.tokenBalance} />

      <main className="page">
        <div className="page__head">
          <div>
            <div className="page__eyebrow">Panel administratora</div>
            <h1 className="page__title">Użytkownicy</h1>
            <div className="page__sub">
              {users.length} kont · {adminCount} admin · łączne saldo{' '}
              {totalTokens} ⬩
            </div>
          </div>
        </div>

        <AdminUserTable users={rows} currentUserId={user.id} />
      </main>
    </div>
  );
}
