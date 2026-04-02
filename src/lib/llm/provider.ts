import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { prisma } from "@/lib/db/prisma";

interface CachedLLM {
  model: BaseChatModel;
  providerId: string;
  modelId: string;
  updatedAt: number;
}

let cachedLLM: CachedLLM | null = null;

/**
 * Fetch the active LLM provider configuration from the database
 * and return a LangChain BaseChatModel instance.
 *
 * The instance is cached and invalidated when the active provider changes.
 */
export async function getActiveLLM(): Promise<BaseChatModel> {
  const activeProvider = await prisma.lLMProvider.findFirst({
    where: { isActive: true },
  });

  if (!activeProvider) {
    throw new Error(
      "No active LLM provider configured. Please set an active provider in the admin settings."
    );
  }

  // Return cached instance if provider hasn't changed
  if (
    cachedLLM &&
    cachedLLM.providerId === activeProvider.id &&
    cachedLLM.modelId === activeProvider.modelId
  ) {
    return cachedLLM.model;
  }

  const model = createChatModel(activeProvider);

  cachedLLM = {
    model,
    providerId: activeProvider.id,
    modelId: activeProvider.modelId,
    updatedAt: Date.now(),
  };

  return model;
}

/**
 * Create a LangChain chat model based on the provider configuration.
 *
 * For OpenAI: uses ChatOpenAI directly.
 * For other providers (Claude, Qwen/通义千问, etc.): uses ChatOpenAI with a
 * custom baseURL, since most providers expose an OpenAI-compatible API.
 */
function createChatModel(provider: {
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  modelId: string;
}): BaseChatModel {
  const isNativeOpenAI =
    provider.name.toLowerCase().includes("openai") &&
    !provider.apiBaseUrl;

  if (isNativeOpenAI) {
    return new ChatOpenAI({
      apiKey: provider.apiKey,
      model: provider.modelId,
      temperature: 0.7,
      streaming: true,
    });
  }

  // Generic fallback: use ChatOpenAI with custom baseURL.
  // Works for Claude (via proxy), 通义千问 (Qwen), DeepSeek, etc.
  return new ChatOpenAI({
    apiKey: provider.apiKey,
    model: provider.modelId,
    temperature: 0.7,
    streaming: true,
    configuration: {
      baseURL: provider.apiBaseUrl,
    },
  });
}

/**
 * Invalidate the cached LLM instance.
 * Call this when the active provider is changed in admin settings.
 */
export function invalidateLLMCache(): void {
  cachedLLM = null;
}
