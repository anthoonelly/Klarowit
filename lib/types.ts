export type DocTypeId =
  | 'opis'
  | 'br'
  | 'harmo'
  | 'budzet'
  | 'ryzyka'
  | 'sow'
  | 'brief';

export interface DocType {
  id: DocTypeId;
  name: string;
  desc: string;
  est: string;
  recommended?: boolean;
  /** Required section headings, in order. */
  sections: string[];
  /** Doc-type specific guidance appended to the system prompt. */
  guidance: string;
}

export interface DocSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

export interface GeneratedDocContent {
  title: string;
  subtitle: string;
  sections: DocSection[];
}

export type DocState = 'queued' | 'generating' | 'done' | 'error';

export interface Document {
  id: DocTypeId;
  title: string;
  state: DocState;
  version: number;
  content: GeneratedDocContent | null;
  errorMessage?: string;
}

export interface ContextExample {
  id: string;
  name: string;
  body: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

export interface Tweaks {
  accent: 'amber' | 'cinnabar' | 'moss' | 'ink';
  theme: 'light' | 'dark';
  serif: 'instrument' | 'fraunces' | 'geist';
  density: 'comfortable' | 'compact';
}

// ─── Server-Sent Events from /api/generate ──────────────────────────────────
export type SSEEvent =
  | { type: 'progress'; percent: number; stage?: string }
  | { type: 'doc_start'; docId: DocTypeId }
  | { type: 'doc_complete'; docId: DocTypeId; content: GeneratedDocContent }
  | { type: 'doc_error'; docId: DocTypeId; message: string }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface GenerateRequest {
  transcript: string;
  docTypes: DocTypeId[];
  instructions?: string;
  examples?: ContextExample[];
  /** For regeneration: which doc to regenerate, with optional note. */
  regenerate?: { docId: DocTypeId; note?: string };
}
