import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { TopBar } from '@/components/topbar';
import { ProjectCard } from '@/components/project-card';
import { Icon } from '@/components/icons';

export const metadata = {
  title: 'Projekty · Memoist',
};

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const user = await getSessionUser();
  if (!user) redirect('/signin?next=/projects');

  const rows = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      fileName: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { documents: true } },
    },
  });

  const projects = rows.map((p: any) => ({
    id: p.id,
    name: p.name,
    fileName: p.fileName,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    documentCount: p._count.documents,
  }));

  return (
    <div className="app">
      <TopBar user={user} tokenBalance={user.tokenBalance} />

      <main className="page">
        <div className="page__head">
          <div>
            <div className="page__eyebrow">Twoje projekty</div>
            <h1 className="page__title">
              {projects.length === 0
                ? 'Jeszcze pusto'
                : `${projects.length} ${
                    projects.length === 1 ? 'projekt' : 'projektów'
                  }`}
            </h1>
          </div>
          <Link href="/workspace" className="btn btn--primary">
            <Icon.Plus className="btn__icon" />
            Nowy projekt
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="page__empty">
            <p>
              Każdy wygenerowany dokument zapisuje się jako projekt — wróć tu,
              aby się do niego dostać.
            </p>
            <Link href="/workspace" className="btn btn--primary">
              Utwórz pierwszy projekt
            </Link>
          </div>
        ) : (
          <div className="project-grid">
            {projects.map((p: any) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
