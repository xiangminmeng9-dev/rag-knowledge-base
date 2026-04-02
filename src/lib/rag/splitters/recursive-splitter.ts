import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function recursiveSplit(
  text: string,
  chunkSize: number = 500,
  overlapPercent: number = 10
): Promise<string[]> {
  if (!text.trim()) return [];

  const overlap = Math.floor(chunkSize * (overlapPercent / 100));
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: overlap,
  });
  const docs = await splitter.createDocuments([text]);
  return docs.map((d) => d.pageContent);
}
