import { prisma } from "@/lib/db/prisma";
import { parseDocument } from "@/lib/rag/parsers";
import { getOrCreateCollection, addToCollection } from "@/lib/rag/vector-store";
import { splitText } from "@/lib/rag/splitters";
import { getEmbeddingModel } from "@/lib/rag/embeddings";
import { ChunkStrategy, FileFormat } from "@/types";

export async function processDocument(documentId: string): Promise<void> {
  try {
    // Step 1: Load Document from DB
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        KnowledgeBase: {
          include: {
            EmbeddingModel: true,
          },
        },
      },
    });

    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Step 2: Update status to PROCESSING
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    });

    // Step 3: Parse document using parser factory
    const text = await parseDocument(document.filePath, document.fileFormat as FileFormat);

    if (!text || text.trim().length === 0) {
      throw new Error("Document content is empty after parsing");
    }

    // Step 4: Split text using configured strategy
    const chunkSize = document.chunkSize ?? 500;
    const overlapPercent = document.chunkOverlapPercent;

    const chunks = await splitText(
      text,
      document.chunkStrategy as ChunkStrategy,
      chunkSize,
      overlapPercent
    );

    // Step 5: Get the KnowledgeBase's EmbeddingModel config
    if (!document.KnowledgeBase.EmbeddingModel) {
      throw new Error("知识库未配置嵌入模型，请先在知识库设置中选择嵌入模型");
    }
    const embeddingModelId = document.KnowledgeBase.EmbeddingModel.id;

    // Step 6: Create embeddings instance using the KB's configured model
    const embeddings = await getEmbeddingModel(embeddingModelId);

    // Step 7: Get/create collection for the knowledge base
    const collection = await getOrCreateCollection(
      document.KnowledgeBase.chromaCollectionName
    );

    // Step 8: Add chunks to vector store with embeddings and metadata
    const batchSize = 100;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchIds = batch.map(
        (_, idx) => `${documentId}_chunk_${i + idx}`
      );
      const batchEmbeddings = await embeddings.embedDocuments(batch);
      const batchMetadata = batch.map((_, idx) => ({
        documentId,
        knowledgeBaseId: document.knowledgeBaseId,
        position: i + idx,
        fileName: document.fileName,
      }));

      await addToCollection(collection, {
        ids: batchIds,
        embeddings: batchEmbeddings,
        documents: batch,
        metadatas: batchMetadata,
      });
    }

    // Step 9: Save Chunk records to database
    const chunkRecords = chunks.map((content, position) => ({
      id: `${documentId}_chunk_${position}`,
      documentId,
      content,
      position,
      metadata: JSON.stringify({
        fileName: document.fileName,
        knowledgeBaseId: document.knowledgeBaseId,
      }),
    }));

    // Insert in batches to avoid SQLite limits
    for (let i = 0; i < chunkRecords.length; i += batchSize) {
      const batch = chunkRecords.slice(i, i + batchSize);
      await prisma.chunk.createMany({ data: batch });
    }

    // Step 10: Update Document status to COMPLETED with chunkCount
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "COMPLETED",
        chunkCount: chunks.length,
        processedAt: new Date(),
      },
    });
  } catch (error) {
    // On error: update status to FAILED with errorMessage
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error(`Failed to process document ${documentId}:`, errorMessage);

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        errorMessage,
      },
    });
  }
}
