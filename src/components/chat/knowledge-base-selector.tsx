"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Loader2 } from "lucide-react";

interface KnowledgeBase {
  id: string;
  name: string;
  _count: { documents: number };
}

interface KnowledgeBaseSelectorProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function KnowledgeBaseSelector({
  selectedId,
  onSelect,
}: KnowledgeBaseSelectorProps) {
  const [knowledgeBases, setKnowledgeBases] = React.useState<KnowledgeBase[]>(
    []
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function fetchKnowledgeBases() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch("/api/knowledge-bases");
        if (!response.ok) {
          throw new Error("Failed to fetch knowledge bases");
        }
        const json = (await response.json()) as {
          data: KnowledgeBase[];
        };
        if (!cancelled) {
          setKnowledgeBases(json.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "An error occurred"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchKnowledgeBases();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          加载中...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 text-sm text-destructive">{error}</div>
    );
  }

  return (
    <div className="px-4 py-3">
      <Select
        value={selectedId ?? ""}
        onValueChange={(value) => {
          if (value) {
            onSelect(value);
          }
        }}
      >
        <SelectTrigger className="w-full h-10">
          <SelectValue placeholder="请选择知识库">
            {selectedId
              ? knowledgeBases.find((kb) => kb.id === selectedId)?.name || selectedId
              : "请选择知识库"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {knowledgeBases.map((kb) => (
            <SelectItem key={kb.id} value={kb.id}>
              <span className="flex w-full items-center justify-between gap-3">
                <span className="truncate">{kb.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {kb._count.documents} 篇文档
                </span>
              </span>
            </SelectItem>
          ))}
          {knowledgeBases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FolderOpen className="size-6 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">暂无知识库</p>
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
