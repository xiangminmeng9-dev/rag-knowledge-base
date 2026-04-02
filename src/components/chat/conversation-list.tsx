"use client";

import * as React from "react";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  knowledgeBaseId: string | null;
  activeConversationId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export function ConversationList({
  knowledgeBaseId,
  activeConversationId,
  onSelect,
  onNew,
}: ConversationListProps) {
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchConversations = React.useCallback(async () => {
    if (!knowledgeBaseId) {
      setConversations([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/chat/conversations?knowledgeBaseId=${encodeURIComponent(knowledgeBaseId)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      const json = (await response.json()) as {
        data: Conversation[];
      };
      setConversations(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId]);

  React.useEffect(() => {
    void fetchConversations();
  }, [fetchConversations]);

  const handleDelete = async (
    e: React.MouseEvent,
    conversationId: string
  ) => {
    e.stopPropagation();

    try {
      const response = await fetch(
        `/api/chat/conversations/${conversationId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }
      setConversations((prev) =>
        prev.filter((c) => c.id !== conversationId)
      );
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffDays === 1) {
      return "昨天";
    }
    if (diffDays < 7) {
      return date.toLocaleDateString("zh-CN", { weekday: "short" });
    }
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  if (!knowledgeBaseId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
        <div className="size-12 rounded-xl bg-muted flex items-center justify-center mb-3">
          <MessageSquare className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">选择知识库开始对话</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* New Conversation Button */}
      <div className="px-3 py-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 h-9"
          onClick={onNew}
        >
          <Plus className="size-4" />
          新对话
        </Button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-3 py-1">
        {isLoading && (
          <div className="space-y-2 py-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-11 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="px-2 py-4 text-center text-xs text-destructive">
            {error}
          </div>
        )}

        {!isLoading && !error && conversations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">暂无对话</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              点击上方按钮开始
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(conversation.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSelect(conversation.id);
              }}
              className={cn(
                "group relative mb-1 flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors cursor-pointer",
                "hover:bg-muted",
                activeConversationId === conversation.id && "bg-muted"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {conversation.title || "新对话"}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {formatDate(conversation.updatedAt)}
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 p-1.5 rounded-md hover:bg-destructive/10"
                onClick={(e) => void handleDelete(e, conversation.id)}
              >
                <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
