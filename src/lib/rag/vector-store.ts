import type { Embeddings } from "@langchain/core/embeddings";

/**
 * In-memory vector store that replaces ChromaDB.
 * Each "collection" is stored as an array of documents with their embeddings.
 * Data persists for the lifetime of the Node.js process but is lost on restart.
 */

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

interface InMemoryCollection {
  name: string;
  documents: Map<string, VectorDocument>;
}

// Global store: collectionName -> collection
const collections = new Map<string, InMemoryCollection>();

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

export async function getOrCreateCollection(name: string): Promise<InMemoryCollection> {
  let col = collections.get(name);
  if (!col) {
    col = { name, documents: new Map() };
    collections.set(name, col);
  }
  return col;
}

export async function getCollection(name: string): Promise<InMemoryCollection> {
  const col = collections.get(name);
  if (!col) {
    // Auto-create if missing (mirrors Chroma behavior for dev)
    return getOrCreateCollection(name);
  }
  return col;
}

export async function deleteCollection(name: string): Promise<void> {
  collections.delete(name);
}

/**
 * Add documents with embeddings to a collection.
 */
export async function addToCollection(
  collection: InMemoryCollection,
  params: {
    ids: string[];
    embeddings: number[][];
    documents: string[];
    metadatas: Record<string, unknown>[];
  }
): Promise<void> {
  for (let i = 0; i < params.ids.length; i++) {
    collection.documents.set(params.ids[i], {
      id: params.ids[i],
      content: params.documents[i],
      embedding: params.embeddings[i],
      metadata: params.metadatas[i],
    });
  }
}

/**
 * Query a collection using embeddings for similarity search.
 */
export async function queryCollection(
  collection: InMemoryCollection,
  params: {
    queryEmbedding: number[];
    nResults: number;
  }
): Promise<{
  ids: string[][];
  documents: (string | null)[][];
  distances: number[][];
}> {
  const docs = Array.from(collection.documents.values());

  if (docs.length === 0) {
    return { ids: [[]], documents: [[]], distances: [[]] };
  }

  // Calculate similarity for all docs
  const scored = docs.map((doc) => ({
    doc,
    similarity: cosineSimilarity(params.queryEmbedding, doc.embedding),
  }));

  // Sort by similarity descending, take top N
  scored.sort((a, b) => b.similarity - a.similarity);
  const topN = scored.slice(0, params.nResults);

  return {
    ids: [topN.map((s) => s.doc.id)],
    documents: [topN.map((s) => s.doc.content)],
    // Return distance (1 - similarity) to match Chroma's distance format
    distances: [topN.map((s) => 1 - s.similarity)],
  };
}

/**
 * Delete specific documents from a collection by ID prefix.
 */
export async function deleteFromCollection(
  collection: InMemoryCollection,
  idPrefix: string
): Promise<void> {
  for (const key of collection.documents.keys()) {
    if (key.startsWith(idPrefix)) {
      collection.documents.delete(key);
    }
  }
}
