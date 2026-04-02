"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, FolderOpen } from "lucide-react";
import {
  KnowledgeBaseCard,
  type KnowledgeBaseItem,
} from "@/components/admin/knowledge-base-card";
import { KnowledgeBaseFormDialog } from "@/components/admin/knowledge-base-form-dialog";

export default function KnowledgeBasesPage() {
  const router = useRouter();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKb, setEditingKb] = useState<KnowledgeBaseItem | undefined>(
    undefined
  );

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge-bases");
      const data = await res.json();
      if (data.data) {
        setKnowledgeBases(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge bases:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKnowledgeBases();
  }, [fetchKnowledgeBases]);

  function handleCreate() {
    setEditingKb(undefined);
    setDialogOpen(true);
  }

  function handleEdit(kb: KnowledgeBaseItem) {
    setEditingKb(kb);
    setDialogOpen(true);
  }

  async function handleDelete(kb: KnowledgeBaseItem) {
    if (
      !confirm(
        `确定要删除「${kb.name}」吗？此操作将永久删除所有相关文档和数据。`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/knowledge-bases/${kb.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKnowledgeBases((prev) => prev.filter((k) => k.id !== kb.id));
      } else {
        const data = await res.json();
        alert(data.error ?? "删除失败");
      }
    } catch {
      alert("删除失败");
    }
  }

  function handleCardClick(kb: KnowledgeBaseItem) {
    router.push(`/admin/knowledge-bases/${kb.id}`);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">知识库</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理知识库与文档集合
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="size-4" />
          新建
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : knowledgeBases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="size-6 text-muted-foreground" />
          </div>
          <p className="font-medium">暂无知识库</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            创建您的第一个知识库开始使用
          </p>
          <Button variant="outline" onClick={handleCreate}>
            <Plus className="size-4" />
            创建知识库
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              className="cursor-pointer"
              onClick={() => handleCardClick(kb)}
            >
              <KnowledgeBaseCard
                knowledgeBase={kb}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}

      <KnowledgeBaseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        knowledgeBase={editingKb}
        onSuccess={fetchKnowledgeBases}
      />
    </div>
  );
}
