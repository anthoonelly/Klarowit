import { NextRequest, NextResponse } from 'next/server';
import { parseTranscriptFile } from '@/lib/parse-transcript';

export const runtime = 'nodejs';
export const maxDuration = 30;

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Nie znaleziono pliku w żądaniu (pole "file").' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: 'Plik jest za duży (max 10 MB).' },
        { status: 413 }
      );
    }

    const buf = await file.arrayBuffer();
    const text = await parseTranscriptFile(buf, file.name);

    if (!text || text.length < 5) {
      return NextResponse.json(
        { error: 'Nie udało się wyodrębnić treści z pliku.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      filename: file.name,
      text,
      wordCount: text.trim().split(/\s+/).length,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Błąd przetwarzania pliku.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
