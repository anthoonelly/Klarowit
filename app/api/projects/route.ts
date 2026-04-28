import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Wymagane zalogowanie.' }, { status: 401 });
  }

  const projects = await prisma.project.findMany({
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

  return NextResponse.json({
    projects: projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      fileName: p.fileName,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      documentCount: p._count.documents,
    })),
  });
}

interface CreateBody {
  name?: string;
  transcript?: string;
  fileName?: string;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Wymagane zalogowanie.' }, { status: 401 });
  }

  let body: CreateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Niepoprawny JSON.' }, { status: 400 });
  }

  const name = (body.name ?? '').trim() || 'Nowy projekt';
  const transcript = (body.transcript ?? '').trim();
  const fileName = body.fileName?.trim() || null;

  if (transcript.length < 20) {
    return NextResponse.json(
      { error: 'Transkrypcja musi mieć min. 20 znaków.' },
      { status: 400 }
    );
  }
  if (transcript.length > 200_000) {
    return NextResponse.json(
      { error: 'Transkrypcja jest za długa (max 200 000 znaków).' },
      { status: 400 }
    );
  }
  if (name.length > 200) {
    return NextResponse.json(
      { error: 'Nazwa projektu jest za długa (max 200 znaków).' },
      { status: 400 }
    );
  }

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name,
      transcript,
      fileName,
    },
    select: {
      id: true,
      name: true,
      fileName: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ project });
}
