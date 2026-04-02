"use client";

import * as React from "react";
import { ChevronRight, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { QueryRewriteBadge } from "@/components/chat/query-rewrite-badge";

interface Source {
  id: string;
  title: string;
  content: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  originalQuery?: string;
  rewrittenQuery?: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  streamingContent?: string;
}

function SourcesSection({ sources }: { sources: Source[] }) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-md text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          className={cn(
            "size-3 transition-transform duration-200",
            isOpen && "rotate-90"
          )}
        />
        {sources.length} 篇参考来源
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {sources.map((source) => (
            <div
              key={source.id}
              className="rounded-lg border bg-muted/30 p-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium truncate">{source.title}</span>
                <span className="shrink-0 text-muted-foreground text-[11px]">
                  {(source.score * 100).toFixed(0)}% 匹配
                </span>
              </div>
              <p className="line-clamp-2 text-muted-foreground leading-relaxed">
                {source.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
      <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
    </div>
  );
}

export function MessageList({
  messages,
  isLoading,
  streamingContent,
}: MessageListProps) {
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
        <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Bot className="size-6 text-muted-foreground" />
        </div>
        <p className="font-medium text-lg">开始对话</p>
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">
          选择一个知识库，然后提出您的问题
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            {/* Assistant Avatar */}
            {message.role === "assistant" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="size-4" />
              </div>
            )}

            {/* Message Content */}
            <div
              className={cn(
                "max-w-[80%] space-y-1",
                message.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground"
                )}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
              </div>

              {/* Query rewrite badge */}
              {message.role === "user" &&
                message.originalQuery &&
                message.rewrittenQuery && (
                  <QueryRewriteBadge
                    original={message.originalQuery}
                    rewritten={message.rewrittenQuery}
                  />
                )}

              {/* Sources */}
              {message.role === "assistant" && message.sources && (
                <SourcesSection sources={message.sources} />
              )}
            </div>

            {/* User Avatar */}
            {message.role === "user" && (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                <User className="size-4" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div className="max-w-[80%]">
              <div className="rounded-2xl bg-muted/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                <div className="whitespace-pre-wrap">{streamingContent}</div>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isLoading && !streamingContent && (
          <div className="flex gap-3 justify-start">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-4" />
            </div>
            <div className="rounded-2xl bg-muted/60 px-4 py-3">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
