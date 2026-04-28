import mammoth from 'mammoth';

export type SupportedExt = 'txt' | 'md' | 'vtt' | 'srt' | 'docx';

export function detectExt(filename: string): SupportedExt | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.txt')) return 'txt';
  if (lower.endsWith('.md')) return 'md';
  if (lower.endsWith('.vtt')) return 'vtt';
  if (lower.endsWith('.srt')) return 'srt';
  if (lower.endsWith('.docx')) return 'docx';
  return null;
}

/**
 * Parse a VTT (WebVTT) file: strip the "WEBVTT" header and timestamp lines,
 * keep only spoken text. Preserve speaker prefixes if present (e.g. "Marek:").
 */
function parseVTT(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  let skipHeader = true;

  for (const line of lines) {
    if (skipHeader) {
      if (line.trim() === '' || /^WEBVTT/i.test(line)) continue;
      skipHeader = false;
    }
    // Skip cue identifiers (numeric or NOTE blocks)
    if (/^\d+$/.test(line.trim())) continue;
    if (/^NOTE\b/i.test(line.trim())) continue;
    // Skip timestamp lines: "00:00:12.000 --> 00:00:48.000"
    if (/-->/i.test(line)) continue;
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Parse SRT: similar structure, blocks of [number / timestamp / text].
 */
function parseSRT(raw: string): string {
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    if (/^\d+$/.test(line.trim())) continue;
    if (/-->/i.test(line)) continue;
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Parse uploaded file buffer based on detected extension.
 * Throws on unsupported / corrupt input.
 */
export async function parseTranscriptFile(
  buf: ArrayBuffer,
  filename: string
): Promise<string> {
  const ext = detectExt(filename);
  if (!ext) {
    throw new Error(
      `Nieobsługiwany format pliku: ${filename}. Akceptowane: .txt, .md, .vtt, .srt, .docx`
    );
  }

  if (ext === 'docx') {
    const result = await mammoth.extractRawText({
      buffer: Buffer.from(buf),
    });
    return result.value.trim();
  }

  // Decode as UTF-8
  const text = new TextDecoder('utf-8').decode(buf);

  switch (ext) {
    case 'vtt':
      return parseVTT(text);
    case 'srt':
      return parseSRT(text);
    case 'txt':
    case 'md':
    default:
      return text.trim();
  }
}
