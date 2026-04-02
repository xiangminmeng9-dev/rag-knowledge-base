"use client";

import * as React from "react";
import ChatLayout from "@/components/layout/chat-layout";
import { KnowledgeBaseSelector } from "@/components/chat/knowledge-base-selector";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageList, type ChatMessage } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatSettings } from "@/components/chat/chat-settings";
import { Separator } from "@/components/ui/separator";

interface Source {
  id: string;
  title: string;
  content: string;
  score: number;
}

export default function ChatPage() {
  const [selectedKnowledgeBaseId, setSelectedKnowledgeBaseId] =
    React.useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] =
    React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [streamingContent, setStreamingContent] = React.useState<
    string | undefined
  >(undefined);
  const [userName, setUserName] = React.useState("");
  const [userRole, setUserRole] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setUserName(json.data.username ?? "");
            setUserRole(json.data.role);
          }
        }
      } catch {
        // Silently fail
      }
    })();
  }, []);

  const handleKnowledgeBaseSelect = (id: string) => {
    setSelectedKnowledgeBaseId(id);
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent(undefined);
    setIsLoading(false);
  };

  const loadConversation = React.useCallback(async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`
      );
      if (!response.ok) {
        throw new Error("Failed to load messages");
      }
      const json = (await response.json()) as { data: ChatMessage[] };
      setMessages(json.data);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setMessages([]);
    }
  }, []);

  const handleConversationSelect = (id: string) => {
    setActiveConversationId(id);
    setStreamingContent(undefined);
    setIsLoading(false);
    void loadConversation(id);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setStreamingContent(undefined);
    setIsLoading(false);
  };

  const createConversation = async (): Promise<string> => {
    const response = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        knowledgeBaseId: selectedKnowledgeBaseId,
      }),
    });
    if (!response.ok) {
      throw new Error("Failed to create conversation");
    }
    const json = (await response.json()) as { data: { id: string } };
    return json.data.id;
  };

  const parseSSEStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    userMessageId: string
  ) => {
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulatedContent = "";
    let pendingSources: Source[] | undefined;
    let pendingRewrittenQuery: string | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const event = JSON.parse(data) as {
              type: string;
              content?: string;
              sources?: Source[];
              originalQuery?: string;
              rewrittenQuery?: string;
              message?: ChatMessage;
            };

            switch (event.type) {
              case "query_rewrite":
                pendingRewrittenQuery = event.rewrittenQuery;
                if (event.originalQuery && event.rewrittenQuery) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === userMessageId
                        ? {
                            ...m,
                            originalQuery: event.originalQuery,
                            rewrittenQuery: event.rewrittenQuery,
                          }
                        : m
                    )
                  );
                }
                break;

              case "sources":
                pendingSources = event.sources;
                break;

              case "content":
                if (event.content) {
                  accumulatedContent += event.content;
                  setStreamingContent(accumulatedContent);
                }
                break;

              case "done": {
                const assistantMessage: ChatMessage = event.message ?? {
                  id: crypto.randomUUID(),
                  role: "assistant",
                  content: accumulatedContent,
                  sources: pendingSources,
                };
                setMessages((prev) => [...prev, assistantMessage]);
                setStreamingContent(undefined);
                break;
              }

              case "error":
                console.error("Stream error:", event.content);
                setStreamingContent(undefined);
                break;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err) {
      console.error("Stream reading error:", err);
      if (accumulatedContent) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: accumulatedContent,
          sources: pendingSources,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setStreamingContent(undefined);
      }
    }
  };

  const handleSend = async (content: string, enableRewrite: boolean) => {
    if (!selectedKnowledgeBaseId) return;

    let conversationId = activeConversationId;

    if (!conversationId) {
      try {
        conversationId = await createConversation();
        setActiveConversationId(conversationId);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    const userMessageId = crypto.randomUUID();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent(undefined);

    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            enableQueryRewrite: enableRewrite,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const body = response.body;
      if (!body) {
        throw new Error("No response body");
      }

      const reader = body.getReader();
      await parseSSEStream(reader, userMessageId);
    } catch (err) {
      console.error("Failed to send message:", err);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "抱歉，发生错误，请重试。",
      };
      setMessages((prev) => [...prev, errorMessage]);
      setStreamingContent(undefined);
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = userRole === "SUPER_ADMIN" || userRole === "KB_ADMIN";

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-14 items-center px-4 border-b">
        <h2 className="font-heading font-semibold">智能问答</h2>
      </div>

      {/* Knowledge Base Selector */}
      <KnowledgeBaseSelector
        selectedId={selectedKnowledgeBaseId}
        onSelect={handleKnowledgeBaseSelect}
      />

      <Separator />

      {/* Conversation List */}
      <ConversationList
        knowledgeBaseId={selectedKnowledgeBaseId}
        activeConversationId={activeConversationId}
        onSelect={handleConversationSelect}
        onNew={handleNewConversation}
      />

      {/* Settings */}
      <div className="border-t px-4 py-3">
        <ChatSettings
          isAdmin={isAdmin}
          userName={userName}
          onNewConversation={handleNewConversation}
        />
      </div>
    </div>
  );

  return (
    <ChatLayout sidebar={sidebar}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          isLoading={isLoading}
          streamingContent={streamingContent}
        />
        <ChatInput
          onSend={(content, enableRewrite) =>
            void handleSend(content, enableRewrite)
          }
          disabled={!selectedKnowledgeBaseId || isLoading}
        />
      </div>
    </ChatLayout>
  );
}
