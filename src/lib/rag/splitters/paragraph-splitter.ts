/**
 * Paragraph-based text splitter.
 *
 * 1. Split text on double-newline boundaries.
 * 2. Merge very small paragraphs together so every chunk approaches
 *    `chunkSize` without exceeding it (except when a single paragraph
 *    is larger than `chunkSize`).
 * 3. Apply overlap by prepending `overlapPercent`% of the previous
 *    chunk's trailing characters to the start of the next chunk.
 */

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function paragraphSplit(
  text: string,
  chunkSize: number = 500,
  overlapPercent: number = 10
): Promise<string[]> {
  if (!text.trim()) return [];

  const paragraphs = splitIntoParagraphs(text);

  if (paragraphs.length === 0) return [];

  // Greedily merge small paragraphs.
  const rawChunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    const separator = current.length > 0 ? "\n\n" : "";
    const candidate = current + separator + para;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current.length > 0) {
        rawChunks.push(current);
      }
      current = para;
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
