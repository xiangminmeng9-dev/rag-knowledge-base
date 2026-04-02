import {
  HumanMessage,
  SystemMessage,
  AIMessage,
} from "@langchain/core/messages";
import { getActiveLLM } from "@/lib/llm/provider";
import { rewriteQuery, type ChatMessage } from "@/lib/rag/query-rewrite";
import {
  retrieveRelevantChunks,
  type RetrievedChunk,
} from "@/lib/rag/retriever";

const RAG_SYSTEM_PROMPT =
  "你是一个智能知识库问答助手。请仅根据以下提供的上下文内容来回答用户的问题。如果上下文中没有相关信息，请说明你没有足够的信息来回答。回答时请注明信息来源于哪篇文档。";

export interface RagChatParams {
  query: string;
  knowledgeBaseId: string;
  conversationHistory: ChatMessage[];
  enableQueryRewrite: boolean;
  topK?: number;
}

export interface RagChatSource {
  chunkId: string;
  documentName: string;
  content: string;
  position: number;
  score: number;
}

export interface RagChatResult {
  stream: ReadableStream<string>;
  rewrittenQuery: string | null;
  sources: RagChatSource[];
}

/**
 * Orchestrate the full RAG pipeline:
 *   1. (Optional) Query rewrite for multi-turn context
 *   2. Vector retrieval from Chroma
 *   3. Prompt construction with retrieved context
 *   4. Streaming LLM generation
 *
 * Returns a ReadableStream of text tokens, the rewritten query (if any),
 * and the source chunks used for the answer.
 */
export async function ragChat(params: RagChatParams): Promise<RagChatResult> {
  const {
    query,
    knowledgeBaseId,
    conversationHistory,
    enableQueryRewrite,
    topK = 5,
  } = params;

  // --- Step 1: Query rewrite ---
  const effectiveQuery = await rewriteQuery(
    query,
    conversationHistory,
    enableQueryRewrite
  );

  const rewrittenQuery = enableQueryRewrite ? effectiveQuery : null;

  // --- Step 2: Vector retrieval ---
  const chunks = await retrieveRelevantChunks(
    effectiveQuery,
    knowledgeBaseId,
    topK
  );

  // --- Step 3: Build messages ---
  const contextBlock = buildContextBlock(chunks);

  const messages = [
    new SystemMessage(`${RAG_SYSTEM_PROMPT}\n\n${contextBlock}`),
    ...conversationHistory.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    ),
    new HumanMessage(query),
  ];

  // --- Step 4: Streaming LLM call ---
  const llm = await getActiveLLM();

  const langchainStream = await llm.stream(messages);

  // Convert LangChain's async iterable into a Web ReadableStream<string>
  const stream = new ReadableStream<string>({
    async start(controller) {
      try {
        for await (const chunk of langchainStream) {
          const text =
            typeof chunk.content === "string"
              ? chunk.content
              : String(chunk.content);
          if (text) {
            controller.enqueue(text);
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  // --- Step 5: Assemble sources ---
  const sources: RagChatSource[] = chunks.map((c) => ({
    chunkId: c.chunkId,
    documentName: c.documentName,
    content: c.content,
    position: c.position,
    score: c.score,
  }));

  return { stream, rewrittenQuery, sources };
}

/**
 * Format retrieved chunks into a context block for the system prompt.
 */
function buildContextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "上下文：\n未找到相关文档。";
  }

  const entries = chunks
    .map(
      (c, i) =>
        `[文档 ${i + 1}: ${c.documentName}]\n${c.content}`
    )
    .join("\n\n");

  return `上下文：\n${entries}`;
}
