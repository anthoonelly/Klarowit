import { NextRequest, NextResponse } from 'next/server';
import { generateDocxBuffer, safeFilename } from '@/lib/export-docx';
import type { GeneratedDocContent } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface ExportRequest {
  content: GeneratedDocContent;
  version?: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExportRequest;
    if (!body?.content?.title || !Array.isArray(body.content.sections)) {
      return NextResponse.json(
        { error: 'Niepoprawna struktura dokumentu.' },
        { status: 400 }
      );
    }

    const version = body.version ?? 1;
    const today = new Date().toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const buffer = await generateDocxBuffer(body.content, {
      version,
      meta: `Wygenerowano: ${today} · Wersja v${version} · Klarowit`,
    });

    const filename = `${safeFilename(body.content.title)}_v${version}.docx`;

    // Wrap Node Buffer in a Blob for portable Web Response body
    const blob = new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    return new NextResponse(blob, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(blob.size),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Błąd eksportu dokumentu.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
