/**
 * Fixed-size text splitter.
 *
 * Splits text into chunks of exactly `chunkSize` characters (the last
 * chunk may be shorter). Adjacent chunks overlap by `overlapPercent`%
 * of `chunkSize` characters.
 */

export async function fixedSizeSplit(
  text: string,
  chunkSize: number = 500,
  overlapPercent: number = 10
): Promise<string[]> {
  if (!text.trim()) return [];

  const overlapChars = Math.floor(chunkSize * (overlapPercent / 100));
  const step = chunkSize - overlapChars;

  if (step <= 0) {
    // Overlap is >= 100 % – degenerate case, return the whole text as one chunk.
    return [text];
  }

  const chunks: string[] = [];
  let offset = 0;

  while (offset < text.length) {
    const chunk = text.slice(offset, offset + chunkSize);
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    offset += step;
  }

  return chunks;
}
