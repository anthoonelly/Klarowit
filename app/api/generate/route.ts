import { NextRequest } from 'next/server';
import { generateDocument } from '@/lib/llm';
import { DOC_TYPE_BY_ID } from '@/lib/doc-types';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { deductTokens, refundTokens, tokenCostFor, totalTokenCost } from '@/lib/tokens';
import type {
  DocTypeId,
  GeneratedDocContent,
  SSEEvent,
} from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300;

const encoder = new TextEncoder();

function sseChunk(event: SSEEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

interface GenerateBody {
  projectId?: string;
  projectName?: string;
  transcript: string;
  fileName?: string;
  docTypes: DocTypeId[];
  instructions?: string;
  examples?: { id: string; name: string; body: string }[];
  regenerate?: { docId: DocTypeId; note?: string };
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Wymagane zalogowanie.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Niepoprawny JSON.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.transcript || body.transcript.trim().length < 20) {
    return new Response(
      JSON.stringify({ error: 'Transkrypcja jest za krótka (min. 20 znaków).' }),
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
      JSON.stringify({ error: 'Maksymalnie 10 dokumentów na jedno wywołanie.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const validIds: DocTypeId[] = [];
  for (const id of body.docTypes) {
    if (DOC_TYPE_BY_ID[id]) validIds.push(id);
  }
  if (validIds.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Żaden z podanych typów nie jest znany.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Token budget ────────────────────────────────────────────────────────
  const cost = totalTokenCost(validIds);
  const fresh = await prisma.user.findUnique({
    where: { id: user.id },
    select: { tokenBalance: true },
  });
  if (!fresh || fresh.tokenBalance < cost) {
    return new Response(
      JSON.stringify({
        error: `Niewystarczające saldo tokenów. Potrzeba: ${cost}, masz: ${fresh?.tokenBalance ?? 0}.`,
        code: 'INSUFFICIENT_TOKENS',
        required: cost,
        balance: fresh?.tokenBalance ?? 0,
      }),
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ── Resolve project ─────────────────────────────────────────────────────
  let project: { id: string; name: string; userId: string };
  if (body.projectId) {
    const existing = await prisma.project.findUnique({
      where: { id: body.projectId },
      select: { id: true, name: true, userId: true },
    });
    if (!existing) {
      return new Response(JSON.stringify({ error: 'Projekt nie istnieje.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (user.role !== 'ADMIN' && existing.userId !== user.id) {
      return new Response(JSON.stringify({ error: 'Brak dostępu do projektu.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    project = existing;
  } else {
    const name =
      (body.projectName ?? '').trim() ||
      `Projekt z ${new Date().toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })}`;
    project = await prisma.project.create({
      data: {
        userId: user.id,
        name,
        transcript: body.transcript,
        fileName: body.fileName ?? null,
      },
      select: { id: true, name: true, userId: true },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        try {
          controller.enqueue(sseChunk(event));
        } catch {
          /* ignore */
        }
      };

      try {
        // Send the resolved project ID up-front so client can save the link
        send({ type: 'project', projectId: project.id, projectName: project.name });

        for (const stage of [
          { p: 5, s: 'parse' },
          { p: 10, s: 'extract' },
          { p: 15, s: 'classify' },
        ]) {
          send({ type: 'progress', percent: stage.p, stage: stage.s });
          await new Promise((r) => setTimeout(r, 120));
        }

        const total = validIds.length;
        let completed = 0;

        for (const docId of validIds) {
          const docType = DOC_TYPE_BY_ID[docId];
          const docCost = tokenCostFor(docId);

          send({ type: 'doc_start', docId });
          send({
            type: 'progress',
            percent: 15 + (completed / total) * 80,
            stage: 'compose',
          });

          let deducted = false;
          try {
            const { newBalance } = await deductTokens(
              user.id,
              docCost,
              `generation:${docId}`,
              { projectId: project.id }
            );
            send({ type: 'balance', balance: newBalance });
            deducted = true;
          } catch (err) {
            const message =
              err instanceof Error ? err.message : 'Błąd rozliczenia tokenów.';
            send({ type: 'doc_error', docId, message });
            completed++;
            continue;
          }

          let content: GeneratedDocContent;
          try {
            content = await generateDocument({
              docType,
              transcript: body.transcript,
              customInstructions: body.instructions,
              examples: body.examples,
              regenerate:
                body.regenerate?.docId === docId
                  ? { note: body.regenerate.note }
                  : undefined,
            });
          } catch (err) {
            if (deducted) {
              const refund = await refundTokens(
                user.id,
                docCost,
                `generation:${docId}`
              ).catch(() => null);
              if (refund) send({ type: 'balance', balance: refund.newBalance });
            }
            const message =
              err instanceof Error ? err.message : 'Nieznany błąd generowania.';
            send({ type: 'doc_error', docId, message });
            completed++;
            continue;
          }

          // Persist
          try {
            if (body.regenerate?.docId === docId) {
              const last = await prisma.document.findFirst({
                where: { projectId: project.id, docType: docId },
                orderBy: { version: 'desc' },
              });
              if (last) {
                await prisma.document.update({
                  where: { id: last.id },
                  data: {
                    content: content as object,
                    version: { increment: 1 },
                    tokensUsed: { increment: docCost },
                    title: content.title,
                  },
                });
              } else {
                await prisma.document.create({
                  data: {
                    projectId: project.id,
                    docType: docId,
                    title: content.title,
                    content: content as object,
                    tokensUsed: docCost,
                  },
                });
              }
            } else {
              // First-time generation for this docType in this project
              const existing = await prisma.document.findFirst({
                where: { projectId: project.id, docType: docId },
              });
              if (existing) {
                await prisma.document.update({
                  where: { id: existing.id },
                  data: {
                    content: content as object,
                    version: { increment: 1 },
                    tokensUsed: { increment: docCost },
                    title: content.title,
                  },
                });
              } else {
                await prisma.document.create({
                  data: {
                    projectId: project.id,
                    docType: docId,
                    title: content.title,
                    content: content as object,
                    tokensUsed: docCost,
                  },
                });
              }
            }
          } catch (err) {
            console.error('Failed to persist document', err);
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
      /* client disconnected */
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
