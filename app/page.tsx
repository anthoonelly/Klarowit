'use client';

import { useCallback, useMemo, useState } from 'react';
import { ContextDrawer } from '@/components/context-drawer';
import { DocumentPane } from '@/components/document-pane';
import { Icon } from '@/components/icons';
import { TopBar } from '@/components/topbar';
import { TranscriptPane } from '@/components/transcript-pane';
import { TweaksPanel } from '@/components/tweaks-panel';
import { useGeneration } from '@/hooks/use-generation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useTweaks } from '@/hooks/use-tweaks';
import {
  DEFAULT_EXAMPLES,
  DEFAULT_INSTRUCTIONS,
} from '@/lib/sample-data';
import type { ContextExample, DocTypeId } from '@/lib/types';

export default function HomePage() {
  // Persistent UI state
  const [tweaks, updateTweak] = useTweaks();
  const [instructions, setInstructions] = useLocalStorage<string>(
    'klarowit:instructions',
    DEFAULT_INSTRUCTIONS
  );
  const [examples, setExamples] = useLocalStorage<ContextExample[]>(
    'klarowit:examples',
    DEFAULT_EXAMPLES
  );

  // Session state
  const [transcript, setTranscript] = useState('');
  const [fileName, setFileName] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<DocTypeId[]>(['opis', 'br']);
  const [contextOpen, setContextOpen] = useState(false);

  const {
    status,
    progress,
    docs,
    activeId,
    setActiveId,
    errorMessage,
    start,
    regenerate,
    cancel,
  } = useGeneration();

  const toggleDoc = useCallback((id: DocTypeId) => {
    setSelectedDocs((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    );
  }, []);

  const handleGenerate = useCallback(() => {
    if (!transcript.trim() || selectedDocs.length === 0) return;
    start({
      transcript,
      docTypes: selectedDocs,
      instructions: instructions.trim() || undefined,
      examples: examples.length > 0 ? examples : undefined,
    });
  }, [transcript, selectedDocs, instructions, examples, start]);

  const handleRegenerate = useCallback(
    (docId: DocTypeId, note: string) => {
      regenerate({
        docId,
        note,
        transcript,
        instructions: instructions.trim() || undefined,
        examples: examples.length > 0 ? examples : undefined,
      });
    },
    [regenerate, transcript, instructions, examples]
  );

  const contextSummary = useMemo(() => {
    const hasInstr = instructions.trim().length > 0;
    const exCount = examples.length;
    const exLabel =
      exCount === 1
        ? '1 wzorzec'
        : exCount >= 2 && exCount <= 4
        ? `${exCount} wzorce`
        : `${exCount} wzorców`;
    return `${hasInstr ? '1 instrukcja' : '0 instrukcji'} · ${exLabel}`;
  }, [instructions, examples]);

  return (
    <>
      <div className="app">
        <TopBar
          status={status}
          contextSummary={contextSummary}
          onOpenContext={() => setContextOpen(true)}
        />

        {errorMessage && (
          <div style={{ padding: '12px 28px 0' }}>
            <div className="error-banner" role="alert">
              <Icon.AlertTriangle className="error-banner__icon" />
              <div>
                <strong>Błąd generacji:</strong> {errorMessage}
                <br />
                <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>
                  Sprawdź czy OPENAI_API_KEY jest ustawiony oraz czy
                  transkrypcja nie jest pusta.
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="workspace">
          <TranscriptPane
            transcript={transcript}
            setTranscript={setTranscript}
            fileName={fileName}
            setFileName={setFileName}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
            onGenerate={handleGenerate}
            onCancel={cancel}
            status={status}
            onOpenContext={() => setContextOpen(true)}
          />
          <DocumentPane
            status={status}
            progress={progress}
            docs={docs}
            activeId={activeId}
            setActiveId={setActiveId}
            onRegenerate={handleRegenerate}
            errorMessage={errorMessage}
          />
        </div>
      </div>

      <ContextDrawer
        open={contextOpen}
        onClose={() => setContextOpen(false)}
        instructions={instructions}
        setInstructions={setInstructions}
        examples={examples}
        setExamples={setExamples}
      />

      <TweaksPanel tweaks={tweaks} update={updateTweak} />
    </>
  );
}
