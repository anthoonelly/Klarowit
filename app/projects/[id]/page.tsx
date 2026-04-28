import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { DOC_TYPE_BY_ID } from '@/lib/doc-types';
import { TopBar } from '@/components/topbar';
import { Icon } from '@/components/icons';
import { ProjectDetailView } from '@/components/project-detail-view';
import type { GeneratedDocContent, PersistedDocument } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { id: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  return {
    title: project ? `${project.name} · Memoist` : 'Projekt · Memoist',
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getSessionUser();
  if (!user) redirect(`/signin?next=/projects/${params.id}`);

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      documents: { orderBy: { createdAt: 'asc' } },
      user: { select: { email: true, name: true } },
    },
  });

  if (!project) notFound();
  if (user.role !== 'ADMIN' && project.userId !== user.id) {
    redirect('/projects');
  }

  const documents: PersistedDocument[] = project.documents.map((d: any) => ({
    id: d.id,
    docType: d.docType,
    title: d.title,
    content: d.content as unknown as GeneratedDocContent,
    version: d.version,
    tokensUsed: d.tokensUsed,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  const totalTokens = documents.reduce((s, d) => s + d.tokensUsed, 0);
  const isOwnerView = project.userId === user.id;

  return (
    <div className="app">
      <TopBar user={user} tokenBalance={user.tokenBalance} />

      <main className="page">
        <div className="page__head">
          <div>
            <div className="page__breadcrumb">
              <Link href="/projects">Projekty</Link>
              <span aria-hidden> / </span>
              <span>{project.name}</span>
            </div>
            <h1 className="page__title">{project.name}</h1>
            <div className="page__sub">
              {documents.length}{' '}
              {documents.length === 1 ? 'dokument' : 'dokumentów'} · zużyto{' '}
              {totalTokens} ⬩
              {!isOwnerView && (
                <>
                  {' '}
                  · właściciel:{' '}
                  <strong>{project.user.name || project.user.email}</strong>{' '}
                  <span className="badge">widok admina</span>
                </>
              )}
            </div>
          </div>
          <div className="page__actions">
            <Link
              href={`/workspace?project=${project.id}`}
              className="btn btn--ghost"
            >
              <Icon.Refresh className="btn__icon" />
              Edytuj transkrypcję / regeneruj
            </Link>
          </div>
        </div>

        <ProjectDetailView
          projectId={project.id}
          projectName={project.name}
          documents={documents.map((d) => ({
            ...d,
            // attach friendly name from doc-types if available
            niceTitle: DOC_TYPE_BY_ID[d.docType as keyof typeof DOC_TYPE_BY_ID]?.name ?? d.title,
          }))}
        />
      </main>
    </div>
  );
}
