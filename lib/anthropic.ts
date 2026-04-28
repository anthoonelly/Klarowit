import Anthropic from '@anthropic-ai/sdk';
import type { Tool } from '@anthropic-ai/sdk/resources/messages';
import type {
  ContextExample,
  DocType,
  GeneratedDocContent,
} from './types';

// ─── Client ─────────────────────────────────────────────────────────────────
let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Add it to .env.local (or Vercel env vars).'
    );
  }
  _client = new Anthropic({ apiKey });
  return _client;
}

export function getModel(): string {
  return process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
}

// ─── Structured output via tool_use ─────────────────────────────────────────
const SUBMIT_DOC_TOOL: Tool = {
  name: 'submit_document',
  description:
    'Submit the generated project document as structured data. Call this exactly once with the complete document.',
  input_schema: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Tytuł dokumentu (np. "Opis projektu", "Dokumentacja B+R").',
      },
      subtitle: {
        type: 'string',
        description:
          'Podtytuł — krótki opis, np. "Karta projektu · v1.0" lub "Uzasadnienie kwalifikacji wg art. 4a pkt 26–28 ustawy o CIT".',
      },
      sections: {
        type: 'array',
        description:
          'Lista sekcji dokumentu w wymaganej kolejności. Każda sekcja musi mieć "body" LUB "bullets" (nie obie naraz).',
        items: {
          type: 'object',
          properties: {
            heading: {
              type: 'string',
              description: 'Nagłówek sekcji.',
            },
            body: {
              type: 'string',
              description:
                'Treść jako spójny akapit prozy. Użyj dla sekcji opisowych. Pomiń to pole jeśli używasz "bullets".',
            },
            bullets: {
              type: 'array',
              description:
                'Treść jako lista punktowana. Użyj dla wyliczeń (cele, zakres, lista pozycji). Pomiń to pole jeśli używasz "body".',
              items: { type: 'string' },
            },
          },
          required: ['heading'],
        },
      },
    },
    required: ['title', 'subtitle', 'sections'],
  },
};

// ─── Prompt builder ─────────────────────────────────────────────────────────
export interface BuildPromptArgs {
  docType: DocType;
  transcript: string;
  customInstructions?: string;
  examples?: ContextExample[];
  /** When regenerating: previous version + user note. */
  regenerate?: { note?: string; previousContent?: GeneratedDocContent };
}

function buildSystemPrompt(args: BuildPromptArgs): string {
  const { docType, customInstructions } = args;

  const baseRole = `Jesteś analitykiem projektowym specjalizującym się w dokumentacji projektów technologicznych i B+R w polskim systemie prawnym i podatkowym. Generujesz profesjonalne dokumenty na podstawie transkrypcji spotkań projektowych.`;

  const userRules = customInstructions?.trim()
    ? `\n\nWYTYCZNE UŻYTKOWNIKA (przestrzegaj ich):\n${customInstructions.trim()}`
    : '';

  const sectionsList = docType.sections
    .map((s, i) => `  ${i + 1}. ${s}`)
    .join('\n');

  const taskBlock = `\n\nZADANIE: Wygeneruj dokument typu "${docType.name}".

Opis: ${docType.desc}

WYMAGANE SEKCJE (w tej kolejności, użyj DOKŁADNIE tych nagłówków lub ich naturalnych rozszerzeń jeśli wytyczne tak sugerują):
${sectionsList}

WYTYCZNE DLA TEGO TYPU DOKUMENTU:
${docType.guidance}`;

  const universalRules = `\n\nUNIWERSALNE ZASADY:
- Pisz w języku polskim, formalnym ale czytelnym (bez korporacyjnego żargonu).
- Trzymaj się faktów z transkrypcji. Nie wymyślaj liczb, dat ani nazwisk.
- Gdy uzupełniasz luki na podstawie kontekstu, oznacz to nawiasami: [domniemane] lub [do uzupełnienia].
- Każdą kwotę i KPI cytuj zgodnie z transkrypcją.
- Dla każdej sekcji wybierz format optymalny: spójna proza ("body") LUB lista punktowana ("bullets") — nigdy oba naraz.
- Dla list: zwięzłe punkty (1–2 zdania), zaczynające się od konkretu, nie od "Bardzo".
- Dla prozy: 2–5 zdań, gęsta merytorycznie.
- Tytuł podaj jako nazwę typu dokumentu (np. "${docType.name}").
- Podtytuł powinien być informacyjny — wersja, data, kontekst projektu.

WYJŚCIE: WYWOŁAJ funkcję \`submit_document\` z kompletnym dokumentem. Nie pisz nic poza wywołaniem funkcji.`;

  return baseRole + userRules + taskBlock + universalRules;
}

function buildUserMessages(args: BuildPromptArgs) {
  const { transcript, examples, regenerate } = args;

  const messages: Anthropic.Messages.MessageParam[] = [];

  // Few-shot examples → prepend as user/assistant turns
  if (examples && examples.length > 0) {
    const exBlock = examples
      .map(
        (ex, i) =>
          `### Wzorzec ${i + 1}: ${ex.name}\n\n${ex.body}`
      )
      .join('\n\n---\n\n');

    messages.push({
      role: 'user',
      content: `Oto wzorce / szablony firmowe, na których powinienem się wzorować stylistycznie i strukturalnie:\n\n${exBlock}\n\nZapamiętaj je — będą służyć jako wskazówki stylu i struktury przy generowaniu dokumentu.`,
    });
    messages.push({
      role: 'assistant',
      content:
        'Zapamiętałem wzorce. Będę się na nich wzorował stylistycznie i strukturalnie, dostosowując treść do rzeczywistego kontekstu projektu z transkrypcji.',
    });
  }

  // Main task message
  let taskMsg = `TRANSKRYPCJA SPOTKANIA:\n\n${transcript.trim()}\n\n---\n\nNa podstawie powyższej transkrypcji wygeneruj dokument i wywołaj \`submit_document\`.`;

  if (regenerate) {
    if (regenerate.note?.trim()) {
      taskMsg += `\n\nUWAGI DO TEJ WERSJI (uwzględnij je): ${regenerate.note.trim()}`;
    } else {
      taskMsg += `\n\nTo jest regeneracja — wygeneruj świeżą wersję dokumentu, dopracowaną względem poprzedniej.`;
    }
  }

  messages.push({ role: 'user', content: taskMsg });

  return messages;
}

// ─── Generate one document ──────────────────────────────────────────────────
export async function generateDocument(
  args: BuildPromptArgs
): Promise<GeneratedDocContent> {
  const client = getAnthropicClient();
  const system = buildSystemPrompt(args);
  const messages = buildUserMessages(args);

  const response = await client.messages.create({
    model: getModel(),
    max_tokens: 8000,
    system,
    messages,
    tools: [SUBMIT_DOC_TOOL],
    tool_choice: { type: 'tool', name: 'submit_document' },
  });

  // Find the tool_use block
  const toolUse = response.content.find(
    (block) => block.type === 'tool_use' && block.name === 'submit_document'
  );

  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(
      `Model nie wywołał funkcji submit_document. Stop reason: ${response.stop_reason}`
    );
  }

  const input = toolUse.input as GeneratedDocContent;

  // Validate
  if (!input.title || !input.subtitle || !Array.isArray(input.sections)) {
    throw new Error('Otrzymano niekompletną strukturę dokumentu z modelu.');
  }

  // Normalize sections: ensure each has heading and either body or bullets (not both empty)
  input.sections = input.sections
    .filter((s) => s && s.heading)
    .map((s) => {
      if (s.bullets && s.bullets.length === 0) delete s.bullets;
      if (s.body === '') delete s.body;
      // If neither set, fall back to a placeholder so UI doesn't break
      if (!s.body && (!s.bullets || s.bullets.length === 0)) {
        s.body = '—';
      }
      return s;
    });

  if (input.sections.length === 0) {
    throw new Error('Otrzymano dokument bez żadnych sekcji.');
  }

  return input;
}
