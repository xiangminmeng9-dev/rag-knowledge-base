import { prisma } from "@/lib/db/prisma";

/**
 * PostgreSQL-backed vector store using Prisma.
 * Stores embeddings as JSON-encoded arrays and computes cosine similarity in JS.
 * Persists across deploys — suitable for Vercel/serverless.
 */

interface VectorSearchResult {
  ids: string[][];
  documents: (string | null)[][];
  distances: number[][];
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

/** Collection handle (just wraps a name for API compatibility) */
export interface VectorCollection {
  name: string;
}

export async function getOrCreateCollection(name: string): Promise<VectorCollection> {
  return { name };
}

export async function getCollection(name: string): Promise<VectorCollection> {
  return { name };
}

export async function deleteCollection(name: string): Promise<void> {
  await prisma.vectorEmbedding.deleteMany({
    where: { collectionName: name },
  });
}

/**
 * Add documents with embeddings to a collection.
 */
export async function addToCollection(
  collection: VectorCollection,
  params: {
    ids: string[];
    embeddings: number[][];
    documents: string[];
    metadatas: Record<string, unknown>[];
  }
): Promise<void> {
  const data = params.ids.map((id, i) => ({
    id,
    collectionName: collection.name,
    chunkId: id,
    content: params.documents[i],
    embedding: JSON.stringify(params.embeddings[i]),
    metadata: JSON.stringify(params.metadatas[i]),
  }));

  // Upsert in batches
  const batchSize = 50;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await Promise.all(
      batch.map((item) =>
        prisma.vectorEmbedding.upsert({
          where: { id: item.id },
          update: {
            content: item.content,
            embedding: item.embedding,
            metadata: item.metadata,
          },
          create: item,
        })
      )
    );
  }
}

/**
 * Query a collection using embeddings for similarity search.
 */
export async function queryCollection(
  collection: VectorCollection,
  params: {
    queryEmbedding: number[];
    nResults: number;
  }
): Promise<VectorSearchResult> {
  // Fetch all embeddings for this collection
  const records = await prisma.vectorEmbedding.findMany({
    where: { collectionName: collection.name },
    select: { id: true, content: true, embedding: true },
  });

  if (records.length === 0) {
    return { ids: [[]], documents: [[]], distances: [[]] };
  }

  // Calculate similarity for each record
  const scored = records.map((record) => {
    const embedding = JSON.parse(record.embedding) as number[];
    return {
      id: record.id,
      content: record.content,
      similarity: cosineSimilarity(params.queryEmbedding, embedding),
    };
  });

  // Sort by similarity descending, take top N
  scored.sort((a, b) => b.similarity - a.similarity);
  const topN = scored.slice(0, params.nResults);

  return {
    ids: [topN.map((s) => s.id)],
    documents: [topN.map((s) => s.content)],
    distances: [topN.map((s) => 1 - s.similarity)],
  };
}

/**
 * Delete specific documents from a collection by ID prefix.
 */
export async function deleteFromCollection(
  collection: VectorCollection,
  idPrefix: string
): Promise<void> {
  await prisma.vectorEmbedding.deleteMany({
    where: {
      collectionName: collection.name,
      id: { startsWith: idPrefix },
    },
  });
}
