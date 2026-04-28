'use client';

import { useCallback, useRef, useState } from 'react';
import { DOC_TYPE_BY_ID } from '@/lib/doc-types';
import type {
  ContextExample,
  Document,
  DocTypeId,
  GenerationStatus,
  SSEEvent,
} from '@/lib/types';

interface StartArgs {
  transcript: string;
  docTypes: DocTypeId[];
  instructions?: string;
  examples?: ContextExample[];
}

interface RegenArgs {
  docId: DocTypeId;
  note?: string;
  transcript: string;
  instructions?: string;
  examples?: ContextExample[];
}

export function useGeneration() {
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [docs, setDocs] = useState<Document[]>([]);
  const [activeId, setActiveId] = useState<DocTypeId | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setProgress(0);
    setDocs([]);
    setActiveId(null);
    setErrorMessage(null);
  }, []);

  /** Consume an SSE stream from /api/generate. */
  const consumeStream = useCallback(
    async (body: object, regenDocId?: DocTypeId) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      let res: Response;
      try {
        res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
      } catch (err) {
        if (ac.signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Błąd sieci.';
        setStatus('error');
        setErrorMessage(msg);
        return;
      }

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const j = await res.json();
          if (j?.error) errMsg = j.error;
        } catch {
          /* ignore */
        }
        setStatus('error');
        setErrorMessage(errMsg);
        // Mark in-progress doc(s) as error
        setDocs((curr) =>
          curr.map((d) =>
            d.state === 'generating' || d.state === 'queued'
              ? { ...d, state: 'error', errorMessage: errMsg }
              : d
          )
        );
        return;
      }

      if (!res.body) {
        setStatus('error');
        setErrorMessage('Brak strumienia odpowiedzi z serwera.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        let chunk: ReadableStreamReadResult<Uint8Array>;
        try {
          chunk = await reader.read();
        } catch (err) {
          if (ac.signal.aborted) return;
          const msg =
            err instanceof Error ? err.message : 'Błąd czytania strumienia.';
          setStatus('error');
          setErrorMessage(msg);
          return;
        }
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });

        // SSE events are separated by double newlines
        let sepIdx: number;
        while ((sepIdx = buffer.indexOf('\n\n')) !== -1) {
          const raw = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);

          const dataLine = raw
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          const dataStr = dataLine.slice(6);
          if (!dataStr) continue;

          let event: SSEEvent;
          try {
            event = JSON.parse(dataStr) as SSEEvent;
          } catch {
            continue;
          }

          handleEvent(event, regenDocId);
        }
      }
    },
    []
  );

  const handleEvent = useCallback(
    (event: SSEEvent, regenDocId?: DocTypeId) => {
      switch (event.type) {
        case 'progress':
          if (!regenDocId) setProgress(event.percent);
          break;

        case 'doc_start':
          setDocs((curr) =>
            curr.map((d) =>
              d.id === event.docId ? { ...d, state: 'generating' } : d
            )
          );
          // If this is the first doc, switch active to it
          setActiveId((curr) => curr ?? event.docId);
          break;

        case 'doc_complete':
          setDocs((curr) =>
            curr.map((d) =>
              d.id === event.docId
                ? {
                    ...d,
                    state: 'done',
                    content: event.content,
                    version: regenDocId ? d.version + 1 : d.version,
                  }
                : d
            )
          );
          break;

        case 'doc_error':
          setDocs((curr) =>
            curr.map((d) =>
              d.id === event.docId
                ? { ...d, state: 'error', errorMessage: event.message }
                : d
            )
          );
          break;

        case 'done':
          setProgress(100);
          setStatus('done');
          break;

        case 'error':
          setStatus('error');
          setErrorMessage(event.message);
          // Mark any in-progress as errored
          setDocs((curr) =>
            curr.map((d) =>
              d.state === 'generating' || d.state === 'queued'
                ? { ...d, state: 'error', errorMessage: event.message }
                : d
            )
          );
          break;
      }
    },
    []
  );

  const start = useCallback(
    async (args: StartArgs) => {
      const initial: Document[] = args.docTypes.map((id, i) => ({
        id,
        title: DOC_TYPE_BY_ID[id]?.name ?? id,
        state: i === 0 ? 'generating' : 'queued',
        version: 1,
        content: null,
      }));
      setDocs(initial);
      setActiveId(initial[0]?.id ?? null);
      setStatus('generating');
      setProgress(0);
      setErrorMessage(null);

      await consumeStream({
        transcript: args.transcript,
        docTypes: args.docTypes,
        instructions: args.instructions,
        examples: args.examples,
      });
    },
    [consumeStream]
  );

  const regenerate = useCallback(
    async (args: RegenArgs) => {
      setDocs((curr) =>
        curr.map((d) =>
          d.id === args.docId
            ? { ...d, state: 'generating', errorMessage: undefined }
            : d
        )
      );
      setActiveId(args.docId);
      setStatus('generating');
      setErrorMessage(null);

      await consumeStream(
        {
          transcript: args.transcript,
          docTypes: [args.docId],
          instructions: args.instructions,
          examples: args.examples,
          regenerate: { docId: args.docId, note: args.note },
        },
        args.docId
      );

      // After regen, status returns to 'done' if any docs are done
      setStatus((s) => (s === 'error' ? 'error' : 'done'));
    },
    [consumeStream]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setDocs((curr) =>
      curr.map((d) =>
        d.state === 'generating' || d.state === 'queued'
          ? { ...d, state: 'error', errorMessage: 'Anulowano' }
          : d
      )
    );
  }, []);

  return {
    status,
    progress,
    docs,
    activeId,
    setActiveId,
    errorMessage,
    start,
    regenerate,
    cancel,
    reset,
  };
}
