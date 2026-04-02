import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getActiveLLM } from "@/lib/llm/provider";

const REWRITE_SYSTEM_PROMPT =
  "Given the conversation history and the latest user question, rewrite the question to be a standalone question optimized for document retrieval. Output ONLY the rewritten question, nothing else.";

export interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Rewrite a user query for better vector retrieval, taking into account
 * the preceding conversation history.
 *
 * When rewriting is disabled the original query is returned unchanged.
 *
 * @param originalQuery - The user's raw question.
 * @param history       - Prior conversation turns ({role, content}[]).
 * @param enabled       - Whether rewrite is turned on.
 * @returns The (possibly rewritten) query string.
 */
export async function rewriteQuery(
  originalQuery: string,
  history: ChatMessage[],
  enabled: boolean
): Promise<string> {
  if (!enabled) {
    return originalQuery;
  }

  // If there is no conversation history, the query is already standalone
  if (history.length === 0) {
    return originalQuery;
  }

  const llm = await getActiveLLM();

  // Build the prompt with conversation history
  const historyText = history
    .map((msg) => `${msg.role}: ${msg.content}`)
    .join("\n");

  const userPrompt = `Conversation history:\n${historyText}\n\nLatest user question: ${originalQuery}`;

  const response = await llm.invoke([
    new SystemMessage(REWRITE_SYSTEM_PROMPT),
    new HumanMessage(userPrompt),
  ]);

  const rewrittenQuery =
    typeof response.content === "string"
      ? response.content.trim()
      : String(response.content).trim();

  // Guard against empty rewrite results
  return rewrittenQuery || originalQuery;
}
