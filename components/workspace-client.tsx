'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContextDrawer } from '@/components/context-drawer';
import { DocumentPane } from '@/components/document-pane';
import { Icon } from '@/components/icons';
import { TopBar } from '@/components/topbar';
import { TranscriptPane } from '@/components/transcript-pane';
import { InsufficientTokensModal } from '@/components/insufficient-tokens-modal';
import { useGeneration } from '@/hooks/use-generation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_EXAMPLES, DEFAULT_INSTRUCTIONS } from '@/lib/sample-data';
import { totalTokenCost } from '@/lib/tokens';
import type { ContextExample, DocTypeId, SessionUser } from '@/lib/types';

interface Props {
  user: SessionUser;
  initialProjectId: string | null;
}

export function WorkspaceClient({ user, initialProjectId }: Props) {
  const router = useRouter();
  useTheme(); // applies theme to <html>

  // Per-user localStorage keys so multi-account on same machine doesn't bleed
  const ls = (k: string) => `memoist:${user.id}:${k}`;

  const [instructions, setInstructions] = useLocalStorage<string>(
    ls('instructions'),
    DEFAULT_INSTRUCTIONS
  );
  const [examples, setExamples] = useLocalStorage<ContextExample[]>(
    ls('examples'),
    DEFAULT_EXAMPLES
  );

  const [transcript, setTranscript] = useState('');
  const [fileName, setFileName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [selectedDocs, setSelectedDocs] = useState<DocTypeId[]>(['opis', 'br']);
  const [contextOpen, setContextOpen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(user.tokenBalance);
  const [insufficientOpen, setInsufficientOpen] = useState<{ required: number; balance: number } | null>(null);

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
  } = useGeneration({
    onBalanceChange: setTokenBalance,
    onProjectId: (id) => setProjectId(id),
  });

  // If we arrived with ?project=<id>, load that project's transcript
  useEffect(() => {
    if (!initialProjectId) return;
    let cancelled = false;
    fetch(`/api/projects/${initialProjectId}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || data.error) return;
        const p = data.project;
        if (!p) return;
        setTranscript(p.transcript);
        setFileName(p.fileName ?? '');
        setProjectName(p.name);
        setProjectId(p.id);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [initialProjectId]);

  const toggleDoc = useCallback((id: DocTypeId) => {
    setSelectedDocs((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    );
  }, []);

  const requiredTokens = useMemo(
    () => totalTokenCost(selectedDocs),
    [selectedDocs]
  );

  const handleGenerate = useCallback(() => {
    if (!transcript.trim() || selectedDocs.length === 0) return;

    if (requiredTokens > tokenBalance) {
      setInsufficientOpen({ required: requiredTokens, balance: tokenBalance });
      return;
    }

    start({
      transcript,
      fileName: fileName || undefined,
      projectId: projectId ?? undefined,
      projectName: projectName || undefined,
      docTypes: selectedDocs,
      instructions: instructions.trim() || undefined,
      examples: examples.length > 0 ? examples : undefined,
    });
  }, [
    transcript,
    fileName,
    projectId,
    projectName,
    selectedDocs,
    instructions,
    examples,
    requiredTokens,
    tokenBalance,
    start,
  ]);

  const handleRegenerate = useCallback(
    (docId: DocTypeId, note: string) => {
      if (!projectId) return; // safety
      regenerate({
        docId,
        note,
        projectId,
        transcript,
        instructions: instructions.trim() || undefined,
        examples: examples.length > 0 ? examples : undefined,
      });
    },
    [regenerate, projectId, transcript, instructions, examples]
  );

  const contextSummary = useMemo(() => {
    const hasInstr = instructions.trim().length > 0;
    const exCount = examples.length;
    const exLabel =
      exCount === 1 ? '1 wzorzec' : exCount >= 2 && exCount <= 4
        ? `${exCount} wzorce`
        : `${exCount} wzorców`;
    return `${hasInstr ? '1 instrukcja' : '0 instrukcji'} · ${exLabel}`;
  }, [instructions, examples]);

  const handleViewProject = () => {
    if (projectId) router.push(`/projects/${projectId}`);
  };

  return (
    <>
      <div className="app">
        <TopBar
          status={status}
          contextSummary={contextSummary}
          onOpenContext={() => setContextOpen(true)}
          user={user}
          tokenBalance={tokenBalance}
        />

        {errorMessage && (
          <div style={{ padding: '12px 28px 0' }}>
            <div className="error-banner" role="alert">
              <Icon.AlertTriangle className="error-banner__icon" />
              <div>
                <strong>Błąd generacji:</strong> {errorMessage}
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
            projectName={projectName}
            setProjectName={setProjectName}
            selectedDocs={selectedDocs}
            toggleDoc={toggleDoc}
            requiredTokens={requiredTokens}
            tokenBalance={tokenBalance}
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
            projectId={projectId}
            projectName={projectName}
            onViewProject={handleViewProject}
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

      <InsufficientTokensModal
        open={!!insufficientOpen}
        required={insufficientOpen?.required ?? 0}
        balance={insufficientOpen?.balance ?? 0}
        onClose={() => setInsufficientOpen(null)}
        isAdmin={user.role === 'ADMIN'}
      />
    </>
  );
}
