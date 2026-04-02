import { Embeddings } from "@langchain/core/embeddings";

/**
 * Simple local embeddings using character n-grams.
 * No external API needed — runs entirely locally.
 * Good enough for demo/dev — for production use a proper embedding model.
 */
export class LocalEmbeddings extends Embeddings {
  private dimensions: number;

  constructor(dimensions: number = 512) {
    super({});
    this.dimensions = dimensions;
  }

  async embedQuery(text: string): Promise<number[]> {
    return this.computeEmbedding(text);
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return documents.map((doc) => this.computeEmbedding(doc));
  }

  private computeEmbedding(text: string): number[] {
    const vec = new Float64Array(this.dimensions);

    if (!text || text.trim().length === 0) {
      return Array.from(vec);
    }

    // Normalize: lowercase and remove excess whitespace
    const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();

    // Generate features from character n-grams (2-grams and 3-grams)
    for (let n = 2; n <= 3; n++) {
      for (let i = 0; i <= normalized.length - n; i++) {
        const gram = normalized.substring(i, i + n);
        // Hash the n-gram to a dimension index
        const hash = this.hashString(gram);
        const idx = Math.abs(hash) % this.dimensions;
        // Use positive/negative based on secondary hash
        vec[idx] += (hash & 1) === 0 ? 1 : -1;
      }
    }

    // Also add word-level features
    const words = normalized.split(/[\s,.\-!?;:，。！？；：、]+/).filter(Boolean);
    for (const word of words) {
      const hash = this.hashString("w_" + word);
      const idx = Math.abs(hash) % this.dimensions;
      vec[idx] += (hash & 1) === 0 ? 2 : -2;
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < this.dimensions; i++) {
      norm += vec[i] * vec[i];
    }
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < this.dimensions; i++) {
        vec[i] /= norm;
      }
    }

    return Array.from(vec);
  }

  /** Simple string hash (FNV-1a inspired) */
  private hashString(str: string): number {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) | 0;
    }
    return hash;
  }
}
