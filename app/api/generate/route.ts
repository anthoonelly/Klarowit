import { NextRequest } from 'next/server';
import { generateDocument } from '@/lib/llm';
import { DOC_TYPE_BY_ID } from '@/lib/doc-types';
import type {
  DocTypeId,
  GenerateRequest,
  GeneratedDocContent,
  SSEEvent,
} from '@/lib/types';

export const runtime = 'nodejs';
// Vercel Pro max; on Hobby tier this is capped to 60s by Vercel anyway.
export const maxDuration = 300;

const encoder = new TextEncoder();

function sseChunk(event: SSEEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

export async function POST(req: NextRequest) {
  let body: GenerateRequest;
  try {
    body = (await req.json()) as GenerateRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: 'Niepoprawny JSON w request body.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Basic validation
  if (!body.transcript || body.transcript.trim().length < 20) {
    return new Response(
      JSON.stringify({
        error: 'Transkrypcja jest za krótka (min. 20 znaków).',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (!Array.isArray(body.docTypes) || body.docTypes.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Wybierz co najmniej jeden typ dokumentu.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
  if (body.docTypes.length > 10) {
    return new Response(
      JSON.stringify({
        error: 'Maksymalnie 10 dokumentów na jedno wywołanie.',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Validate doc type IDs
  const validIds: DocTypeId[] = [];
  for (const id of body.docTypes) {
    if (DOC_TYPE_BY_ID[id]) validIds.push(id);
  }
  if (validIds.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Żaden z podanych typów dokumentów nie jest znany.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stream
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        try {
          controller.enqueue(sseChunk(event));
        } catch {
          // controller may be closed if client disconnected
        }
      };

      try {
        // Initial progress: simulate the "stages" while we kick off the first request.
        // Once a doc starts streaming back, the per-doc progress takes over.
        const stages = [
          { p: 5, s: 'parse' },
          { p: 10, s: 'extract' },
          { p: 15, s: 'classify' },
        ];
        for (const stage of stages) {
          send({ type: 'progress', percent: stage.p, stage: stage.s });
          await new Promise((r) => setTimeout(r, 120));
        }

        const total = validIds.length;
        let completed = 0;

        // Generate sequentially so the UI shows queued → generating → done in order.
        // (Parallel generation would also work, but order matters for the tab UX.)
        for (const docId of validIds) {
          const docType = DOC_TYPE_BY_ID[docId];
          send({ type: 'doc_start', docId });

          // Bump progress as we start each doc
          const baseProgress = 15 + (completed / total) * 80;
          send({
            type: 'progress',
            percent: baseProgress,
            stage: 'compose',
          });

          let content: GeneratedDocContent;
          try {
            content = await generateDocument({
              docType,
              transcript: body.transcript,
              customInstructions: body.instructions,
              examples: body.examples,
              regenerate: body.regenerate?.docId === docId
                ? { note: body.regenerate.note }
                : undefined,
            });
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Nieznany błąd generowania.';
            send({ type: 'doc_error', docId, message });
            completed++;
            continue;
          }

          send({ type: 'doc_complete', docId, content });
          completed++;
          send({
            type: 'progress',
            percent: 15 + (completed / total) * 80,
            stage: 'review',
          });
        }

        send({ type: 'progress', percent: 100, stage: 'done' });
        send({ type: 'done' });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Nieznany błąd serwera.';
        send({ type: 'error', message });
      } finally {
        controller.close();
      }
    },

    cancel() {
      // Client disconnected. Nothing to clean up — Anthropic SDK calls are
      // already in-flight and will resolve in the background.
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
