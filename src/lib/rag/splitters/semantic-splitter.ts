/**
 * Semantic text splitter.
 *
 * Splits text by semantic boundaries:
 * 1. Split into paragraphs (double-newline boundaries).
 * 2. Within each paragraph, detect sentence boundaries so we never break
 *    mid-sentence when merging.
 * 3. Greedily merge sentences / small paragraphs into chunks that respect
 *    `chunkSize`, keeping semantically coherent units together.
 * 4. Apply overlap by prepending the trailing `overlapPercent`% characters of
 *    the previous chunk to the beginning of the next chunk.
 */

const SENTENCE_RE = /(?<=[.!?。！？])\s+/;

function splitIntoSentences(text: string): string[] {
  return text
    .split(SENTENCE_RE)
    .map((s) => s.trim())
    .filter(Boolean);
}

function splitIntoParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function semanticSplit(
  text: string,
  chunkSize: number = 500,
  overlapPercent: number = 10
): Promise<string[]> {
  if (!text.trim()) return [];

  const paragraphs = splitIntoParagraphs(text);

  // Break every paragraph into sentences so we can merge at sentence
  // boundaries and avoid cutting mid-sentence.
  const sentences: string[] = [];
  for (const para of paragraphs) {
    const paraSentences = splitIntoSentences(para);
    if (paraSentences.length === 0) {
      sentences.push(para);
    } else {
      sentences.push(...paraSentences);
    }
    // Insert a paragraph marker so we prefer breaking here.
    sentences.push("\n\n");
  }
  // Remove trailing marker
  if (sentences.length > 0 && sentences[sentences.length - 1] === "\n\n") {
    sentences.pop();
  }

  // Greedily merge sentences into chunks.
  const rawChunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (sentence === "\n\n") {
      // Paragraph boundary – if adding a newline separator would exceed chunk
      // size, flush current chunk.
      if (current.length > 0 && current.length + 2 > chunkSize) {
        rawChunks.push(current.trim());
        current = "";
      } else if (current.length > 0) {
        current += "\n\n";
      }
      continue;
    }

    const separator = current.length > 0 ? " " : "";
    const candidate = current + separator + sentence;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      if (current.trim().length > 0) {
        rawChunks.push(current.trim());
      }
      // Start a new chunk with this sentence. If the sentence itself exceeds
      // chunkSize we still keep it as one chunk (we never break mid-sentence).
      current = sentence;
    }
  }

  if (current.trim().length > 0) {
    rawChunks.push(current.trim());
  }

  if (rawChunks.length === 0) return [];

  // Apply overlap: prepend the tail of the previous chunk to the next chunk.
  const overlapChars = Math.floor(chunkSize * (overlapPercent / 100));
  const chunks: string[] = [rawChunks[0]];

  for (let i = 1; i < rawChunks.length; i++) {
    const prev = rawChunks[i - 1];
    const overlapText = prev.slice(-overlapChars);
    const merged = overlapText + " " + rawChunks[i];
    chunks.push(merged.trim());
  }

  return chunks;
}
