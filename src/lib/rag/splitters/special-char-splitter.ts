/**
 * Special-character delimiter text splitter.
 *
 * Splits text on common delimiter lines: ---, ===, ***, or a custom
 * delimiter supplied via a fourth argument.  If none of the delimiters
 * are found in the text the function falls back to paragraph splitting
 * (double-newline boundaries).
 *
 * Overlap is applied by prepending the trailing `overlapPercent`%
 * characters of the previous chunk to the start of the next chunk.
 */

import { paragraphSplit } from "@/lib/rag/splitters/paragraph-splitter";

/** Matches a line that consists solely of 3+ repeated delimiter chars. */
const DELIMITER_RE = /^[ \t]*(?:-{3,}|={3,}|\*{3,})[ \t]*$/m;

function splitByDelimiter(text: string, delimiter?: string): string[] | null {
  if (delimiter) {
    // Escape special regex characters in the custom delimiter.
    const escaped = delimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    const parts = text.split(re).map((s) => s.trim()).filter(Boolean);
    return parts.length > 1 ? parts : null;
  }

  // Try the default set of delimiters.
  if (DELIMITER_RE.test(text)) {
    const parts = text
      .split(DELIMITER_RE)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length > 1 ? parts : null;
  }

  return null;
}

export async function specialCharSplit(
  text: string,
  chunkSize: number = 500,
  overlapPercent: number = 10,
  delimiter?: string
): Promise<string[]> {
  if (!text.trim()) return [];

  const sections = splitByDelimiter(text, delimiter);

  // Fallback to paragraph splitting when no delimiters are found.
  if (!sections) {
    return paragraphSplit(text, chunkSize, overlapPercent);
  }

  // Merge small sections so each chunk approaches chunkSize.
  const rawChunks: string[] = [];
  let current = "";

  for (const section of sections) {
    const separator = current.length > 0 ? "\n\n" : "";
    const candidate = current + separator + section;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current.length > 0) {
        rawChunks.push(current);
      }
      current = section;
    }
  }

  if (current.length > 0) {
    rawChunks.push(current);
  }

  if (rawChunks.length === 0) return [];

  // Apply overlap.
  const overlapChars = Math.floor(chunkSize * (overlapPercent / 100));
  const chunks: string[] = [rawChunks[0]];

  for (let i = 1; i < rawChunks.length; i++) {
    if (overlapChars > 0) {
      const prev = rawChunks[i - 1];
      const tail = prev.slice(-overlapChars);
      chunks.push((tail + "\n\n" + rawChunks[i]).trim());
    } else {
      chunks.push(rawChunks[i]);
    }
  }

  return chunks;
}
