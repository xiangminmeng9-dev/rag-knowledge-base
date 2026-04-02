import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { ragChat, type RagChatSource } from "@/lib/rag/chat-engine";
import type { ChatMessage } from "@/lib/rag/query-rewrite";

export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string };
  const { id: conversationId } = await params;

  try {
    // Verify conversation belongs to current user
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    // Parse sources JSON field
    const parsed = messages.map((msg) => ({
      ...msg,
      sources: msg.sources ? (JSON.parse(msg.sources) as RagChatSource[]) : null,
    }));

    return NextResponse.json({ data: parsed });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string };
  const { id: conversationId } = await params;

  try {
    // 1. Verify conversation belongs to current user
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.userId !== user.id) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      content?: string;
      enableQueryRewrite?: boolean;
    };
    const { content, enableQueryRewrite = false } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    // 2. Save user message to database
    await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        conversationId,
        role: "USER",
        content: content.trim(),
      },
    });

    // 3. Load conversation history from database
    const historyMessages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const conversationHistory: ChatMessage[] = historyMessages
      .slice(0, -1) // Exclude the message we just saved (it's the current query)
      .map((msg) => ({
        role: msg.role === "USER" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }));

    // 4. Call ragChat() from chat-engine
    const ragResult = await ragChat({
      query: content.trim(),
      knowledgeBaseId: conversation.knowledgeBaseId,
      conversationHistory,
      enableQueryRewrite,
    });

    // 5. Stream response using Server-Sent Events format
    const { stream: ragStream, rewrittenQuery, sources } = ragResult;

    const encoder = new TextEncoder();
    let fullContent = "";

    const sseStream = new ReadableStream({
      async start(controller) {
        try {
          // Send query_rewrite event (if rewritten)
          if (rewrittenQuery) {
            controller.enqueue(encoder.encode(formatSSE({
              type: "query_rewrite",
              originalQuery: content.trim(),
              rewrittenQuery,
            })));
          }

          // Send sources event
          controller.enqueue(encoder.encode(formatSSE({
            type: "sources",
            sources,
          })));

          // Stream content deltas from the RAG stream
          const reader = ragStream.getReader();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            fullContent += value;
            controller.enqueue(encoder.encode(formatSSE({
              type: "content",
              content: value,
            })));
          }

          // Save assistant message to database with sources JSON
          const assistantMessageId = crypto.randomUUID();
          await prisma.message.create({
            data: {
              id: assistantMessageId,
              conversationId,
              role: "ASSISTANT",
              content: fullContent,
              originalQuery: content.trim(),
              rewrittenQuery,
              sources: JSON.stringify(sources),
            },
          });

          // Update conversation title if it's the first exchange
          if (historyMessages.length <= 1) {
            const title =
              content.trim().length > 80
                ? content.trim().slice(0, 77) + "..."
                : content.trim();
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { title },
            });
          }

          // Update conversation updatedAt
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
          });

          // Send done event with full message
          controller.enqueue(encoder.encode(formatSSE({
            type: "done",
            message: {
              id: assistantMessageId,
              role: "assistant",
              content: fullContent,
              sources,
            },
          })));

          controller.close();
        } catch (err) {
          console.error("SSE streaming error:", err);
          const errorEvent = formatSSE({
            type: "error",
            content: err instanceof Error ? err.message : "Stream failed",
          });
          controller.enqueue(encoder.encode(errorEvent));
          controller.close();
        }
      },
    });

    // 6. Return Response with text/event-stream content type
    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Failed to process chat message:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

/**
 * Format data as a Server-Sent Event string.
 */
function formatSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}
