import { OpenAIEmbeddings } from "@langchain/openai";
import { prisma } from "@/lib/db/prisma";
import type { Embeddings } from "@langchain/core/embeddings";
import { LocalEmbeddings } from "@/lib/rag/local-embeddings";

/**
 * Get a LangChain Embeddings instance based on the EmbeddingModel configuration.
 *
 * Supports:
 * - "local" provider: uses LocalEmbeddings (no API needed, runs in-process)
 * - "openai" provider: uses OpenAIEmbeddings (requires API key)
 * - other providers: tries OpenAI-compatible API with custom baseURL
 */
export async function getEmbeddingModel(
  embeddingModelId?: string
): Promise<Embeddings> {
  // Load embedding model config from database
  const embeddingModel = embeddingModelId
    ? await prisma.embeddingModel.findUnique({
        where: { id: embeddingModelId },
      })
    : await prisma.embeddingModel.findFirst({
        where: { isDefault: true },
      });

  if (!embeddingModel) {
    // Fallback to local embeddings if no model configured
    console.log("No embedding model configured, using local embeddings");
    return new LocalEmbeddings(512);
  }

  // Use local embeddings for "local" provider
  if (embeddingModel.provider.toLowerCase() === "local") {
    return new LocalEmbeddings(embeddingModel.dimensions);
  }

  // Try to get API key from LLMProvider matching the embedding model's provider
  const llmProvider = await prisma.lLMProvider.findFirst({
    where: {
      name: { contains: embeddingModel.provider },
      isActive: true,
    },
  });

  const apiKey = llmProvider?.apiKey || process.env.OPENAI_API_KEY;
  const apiBaseUrl = llmProvider?.apiBaseUrl;

  // If no API key available, fall back to local embeddings
  if (!apiKey) {
    console.log(
      `No API key found for provider "${embeddingModel.provider}", using local embeddings`
    );
    return new LocalEmbeddings(embeddingModel.dimensions);
  }

  // Create OpenAI-compatible embeddings instance
  const config: ConstructorParameters<typeof OpenAIEmbeddings>[0] = {
    modelName: embeddingModel.modelId,
    dimensions: embeddingModel.dimensions,
  };

  if (apiKey) {
    config.openAIApiKey = apiKey;
  }

  if (apiBaseUrl) {
    config.configuration = {
      baseURL: apiBaseUrl,
    };
  }

  return new OpenAIEmbeddings(config);
}
