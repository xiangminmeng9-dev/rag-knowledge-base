import { ChunkStrategy } from "@/types";
import { recursiveSplit } from "@/lib/rag/splitters/recursive-splitter";
import { semanticSplit } from "@/lib/rag/splitters/semantic-splitter";
import { paragraphSplit } from "@/lib/rag/splitters/paragraph-splitter";
import { fixedSizeSplit } from "@/lib/rag/splitters/fixed-size-splitter";
import { specialCharSplit } from "@/lib/rag/splitters/special-char-splitter";

export {
  recursiveSplit,
  semanticSplit,
  paragraphSplit,
  fixedSizeSplit,
  specialCharSplit,
};

export async function splitText(
  text: string,
  strategy: ChunkStrategy,
  chunkSize: number = 500,
  overlapPercent: number = 10
): Promise<string[]> {
  switch (strategy) {
    case "RECURSIVE":
      return recursiveSplit(text, chunkSize, overlapPercent);
    case "SEMANTIC":
      return semanticSplit(text, chunkSize, overlapPercent);
    case "PARAGRAPH":
      return paragraphSplit(text, chunkSize, overlapPercent);
    case "FIXED_SIZE":
      return fixedSizeSplit(text, chunkSize, overlapPercent);
    case "SPECIAL_CHAR":
      return specialCharSplit(text, chunkSize, overlapPercent);
    default:
      return recursiveSplit(text, chunkSize, overlapPercent);
  }
}
