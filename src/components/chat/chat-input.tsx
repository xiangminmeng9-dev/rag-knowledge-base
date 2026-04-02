"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (content: string, enableRewrite: boolean) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [content, setContent] = React.useState("");
  const [enableRewrite, setEnableRewrite] = React.useState(true);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed, enableRewrite);
    setContent("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-card/80 backdrop-blur-sm px-4 py-4">
      <div className="mx-auto max-w-3xl">
        {/* Input container */}
        <div className={cn(
          "relative flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-all duration-200",
          "focus-within:shadow-md focus-within:border-primary/30",
          disabled && "opacity-60"
        )}>
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入问题，按回车发送..."
            disabled={disabled}
            className="max-h-32 min-h-[48px] resize-none border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent px-2"
            rows={1}
          />
          <Button
            size="icon"
            disabled={disabled || !content.trim()}
            onClick={handleSend}
            className="shrink-0 size-10 rounded-xl"
          >
            <Send className="size-4" />
          </Button>
        </div>

        {/* Query rewrite toggle */}
        <div className="mt-3 flex items-center gap-2 px-1">
          <Switch
            checked={enableRewrite}
            onCheckedChange={setEnableRewrite}
            size="sm"
          />
          <Label
            className="cursor-pointer text-xs text-muted-foreground flex items-center gap-1.5"
            onClick={() => setEnableRewrite(!enableRewrite)}
          >
            <Sparkles className="size-3" />
            查询改写
          </Label>
        </div>
      </div>
    </div>
  );
}
