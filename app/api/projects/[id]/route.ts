import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Wymagane zalogowanie.' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: 'Projekt nie istnieje.' }, { status: 404 });
  }
  // ADMIN can read any project; others only their own
  if (user.role !== 'ADMIN' && project.userId !== user.id) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 });
  }

  return NextResponse.json({
    project: {
      id: project.id,
      userId: project.userId,
      name: project.name,
      transcript: project.transcript,
      fileName: project.fileName,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      documents: project.documents.map((d: any) => ({
        id: d.id,
        docType: d.docType,
        title: d.title,
        content: d.content,
        version: d.version,
        tokensUsed: d.tokensUsed,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    },
  });
}

interface PatchBody {
  name?: string;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Wymagane zalogowanie.' }, { status: 401 });
  }

  let body: PatchBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Niepoprawny JSON.' }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Projekt nie istnieje.' }, { status: 404 });
  }
  if (user.role !== 'ADMIN' && project.userId !== user.id) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string') {
    const name = body.name.trim();
    if (name.length === 0 || name.length > 200) {
      return NextResponse.json(
        { error: 'Nazwa projektu (1–200 znaków).' },
        { status: 400 }
      );
    }
    data.name = name;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Brak zmian.' }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: params.id },
    data,
    select: { id: true, name: true, updatedAt: true },
  });

  return NextResponse.json({ project: updated });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Wymagane zalogowanie.' }, { status: 401 });
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    select: { userId: true },
  });
  if (!project) {
    return NextResponse.json({ error: 'Projekt nie istnieje.' }, { status: 404 });
  }
  if (user.role !== 'ADMIN' && project.userId !== user.id) {
    return NextResponse.json({ error: 'Brak dostępu.' }, { status: 403 });
  }

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
