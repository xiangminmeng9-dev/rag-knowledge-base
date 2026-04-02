import { getCollection, queryCollection } from "@/lib/rag/vector-store";
import { getEmbeddingModel } from "@/lib/rag/embeddings";
import { prisma } from "@/lib/db/prisma";

export interface RetrievedChunk {
  chunkId: string;
  content: string;
  documentName: string;
  position: number;
  score: number;
}

/**
 * Retrieve the most relevant document chunks for a given query
 * from the in-memory vector store backing the specified knowledge base.
 */
export async function retrieveRelevantChunks(
  query: string,
  knowledgeBaseId: string,
  k: number = 5
): Promise<RetrievedChunk[]> {
  // Look up the knowledge base to get the collection name and embedding model
  const knowledgeBase = await prisma.knowledgeBase.findUnique({
    where: { id: knowledgeBaseId },
    select: { chromaCollectionName: true, embeddingModelId: true },
  });

  if (!knowledgeBase) {
    throw new Error(`Knowledge base not found: ${knowledgeBaseId}`);
  }

  // Get embedding model to embed the query
  const embeddings = await getEmbeddingModel(knowledgeBase.embeddingModelId);
  const queryEmbedding = await embeddings.embedQuery(query);

  // Query the vector store collection
  const collection = await getCollection(knowledgeBase.chromaCollectionName);

  const results = await queryCollection(collection, {
    queryEmbedding,
    nResults: k,
  });

  // If no results, return empty array
  if (!results.ids[0] || results.ids[0].length === 0) {
    return [];
  }

  const chunkIds = results.ids[0];
  const documents = results.documents[0] ?? [];
  const distances = results.distances?.[0] ?? [];

  // Fetch chunk records from Prisma to get positions and document names
  // The IDs in our vector store are formatted as `${documentId}_chunk_${position}`
  // We need to look up by content match since chunk DB IDs differ from vector store IDs
  const chunks = await prisma.chunk.findMany({
    where: {
      Document: {
        knowledgeBaseId,
      },
    },
    select: {
      id: true,
      content: true,
      position: true,
      Document: {
        select: {
          fileName: true,
        },
      },
    },
  });

  // Build a lookup map by content for matching
  const chunkByContent = new Map(
    chunks.map((c) => [
      c.content.substring(0, 200), // Use first 200 chars as key to avoid huge keys
      {
        id: c.id,
        content: c.content,
        position: c.position,
        documentName: c.Document.fileName,
      },
    ])
  );

  // Assemble results, preserving the order from vector store (sorted by relevance)
  const retrievedChunks: RetrievedChunk[] = [];

  for (let i = 0; i < chunkIds.length; i++) {
    const content = documents[i] ?? "";
    const distance = distances[i] ?? 0;
    const score = 1 / (1 + distance);

    // Try to find the chunk in DB by content prefix
    const chunkData = chunkByContent.get(content.substring(0, 200));

    if (chunkData) {
      retrievedChunks.push({
        chunkId: chunkData.id,
        content: chunkData.content,
        documentName: chunkData.documentName,
        position: chunkData.position,
        score,
      });
    } else {
      // Chunk exists in vector store but not in DB; use vector store content
      retrievedChunks.push({
        chunkId: chunkIds[i],
        content,
        documentName: "Unknown",
        position: 0,
        score,
      });
    }
  }

  return retrievedChunks;
}
