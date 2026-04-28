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
  sections: string[];
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
  /** Persistent DB id, available after persistence. */
  dbId?: string;
}

export interface ContextExample {
  id: string;
  name: string;
  body: string;
}

export type GenerationStatus = 'idle' | 'generating' | 'done' | 'error';

// ─── Auth ───────────────────────────────────────────────────────────────────
export type UserRole = 'USER' | 'ADMIN';

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tokenBalance: number;
}

// ─── Theme ──────────────────────────────────────────────────────────────────
export type Theme = 'light' | 'dark';

// ─── SSE ────────────────────────────────────────────────────────────────────
export type SSEEvent =
  | { type: 'progress'; percent: number; stage?: string }
  | { type: 'project'; projectId: string; projectName: string }
  | { type: 'doc_start'; docId: DocTypeId }
  | { type: 'doc_complete'; docId: DocTypeId; content: GeneratedDocContent }
  | { type: 'doc_error'; docId: DocTypeId; message: string }
  | { type: 'balance'; balance: number }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface GenerateRequest {
  projectId?: string;
  projectName?: string;
  transcript: string;
  fileName?: string;
  docTypes: DocTypeId[];
  instructions?: string;
  examples?: ContextExample[];
  regenerate?: { docId: DocTypeId; note?: string };
}

// ─── API DTOs ───────────────────────────────────────────────────────────────
export interface ProjectSummary {
  id: string;
  name: string;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface ProjectDetail {
  id: string;
  userId: string;
  name: string;
  transcript: string;
  fileName: string | null;
  createdAt: string;
  updatedAt: string;
  documents: PersistedDocument[];
}

export interface PersistedDocument {
  id: string;
  docType: string;
  title: string;
  content: GeneratedDocContent;
  version: number;
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  tokenBalance: number;
  createdAt: string;
  projectCount: number;
}
