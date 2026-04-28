import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { TopBar } from '@/components/topbar';
import { AdminUserClient } from '@/components/admin-user-client';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const u = await prisma.user.findUnique({
    where: { id: params.id },
    select: { email: true },
  });
  return { title: u ? `${u.email} · admin · Memoist` : 'Admin · Memoist' };
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getSessionUser();
  if (!me) redirect(`/signin?next=/admin/users/${params.id}`);
  if (me.role !== 'ADMIN') redirect('/workspace');

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      projects: {
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { documents: true } },
        },
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 25,
      },
      sessions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          userAgent: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!target) notFound();

  return (
    <div className="app">
      <TopBar user={me} tokenBalance={me.tokenBalance} />

      <main className="page">
        <div className="page__head">
          <div>
            <div className="page__breadcrumb">
              <Link href="/admin">Admin</Link>
              <span aria-hidden> / </span>
              <Link href="/admin">Użytkownicy</Link>
              <span aria-hidden> / </span>
              <span>{target.email}</span>
            </div>
            <h1 className="page__title">{target.name || target.email}</h1>
            <div className="page__sub">
              {target.email} ·{' '}
              <span
                className={`admin-table__role admin-table__role--${target.role.toLowerCase()}`}
              >
                {target.role.toLowerCase()}
              </span>
              {target.id === me.id && (
                <>
                  {' '}
                  <span className="admin-table__self">to ty</span>
                </>
              )}
            </div>
          </div>
        </div>

        <AdminUserClient
          isSelf={target.id === me.id}
          target={{
            id: target.id,
            email: target.email,
            name: target.name,
            role: target.role,
            tokenBalance: target.tokenBalance,
            createdAt: target.createdAt.toISOString(),
            projects: target.projects.map((p: any) => ({
              id: p.id,
              name: p.name,
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString(),
              documentCount: p._count.documents,
            })),
            transactions: target.transactions.map((t: any) => ({
              id: t.id,
              amount: t.amount,
              reason: t.reason,
              createdAt: t.createdAt.toISOString(),
            })),
            sessions: target.sessions.map((s: any) => ({
              id: s.id,
              userAgent: s.userAgent,
              ipAddress: s.ipAddress,
              createdAt: s.createdAt.toISOString(),
              expiresAt: s.expiresAt.toISOString(),
            })),
          }}
        />
      </main>
    </div>
  );
}
