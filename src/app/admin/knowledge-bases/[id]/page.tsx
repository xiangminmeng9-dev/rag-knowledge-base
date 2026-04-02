"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, PencilIcon, Loader2Icon } from "lucide-react";
import { DocumentUpload } from "@/components/admin/document-upload";
import { DocumentTable } from "@/components/admin/document-table";
import { KnowledgeBaseFormDialog } from "@/components/admin/knowledge-base-form-dialog";
import type { KnowledgeBaseItem } from "@/components/admin/knowledge-base-card";

interface KnowledgeBaseDetail extends KnowledgeBaseItem {
  chunkCount: number;
  embeddingModel: {
    id: string;
    name: string;
    provider: string;
    modelId: string;
    dimensions: number;
  } | null;
}

export default function KnowledgeBaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseDetail | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchKnowledgeBase = useCallback(async () => {
    try {
      const res = await fetch(`/api/knowledge-bases/${params.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          router.push("/admin/knowledge-bases");
          return;
        }
        throw new Error("Failed to fetch");
      }
      const data = await res.json();
      if (data.data) {
        setKnowledgeBase(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge base:", error);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchKnowledgeBase();
  }, [fetchKnowledgeBase]);

  function handleUploadComplete() {
    // Dispatch event to refresh document table
    window.dispatchEvent(
      new CustomEvent(`refresh-documents-${params.id}`)
    );
    // Also refresh KB info for updated counts
    fetchKnowledgeBase();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!knowledgeBase) {
    return (
      <div className="container mx-auto py-6 px-4">
        <p className="text-muted-foreground">未找到知识库。</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between border-b pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => router.push("/admin/knowledge-bases")}
              className="-ml-2 h-8 w-8 text-muted-foreground"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <span>返回列表</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {knowledgeBase.name}
            </h1>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setEditDialogOpen(true)}
            >
              <PencilIcon className="size-4" />
              <span className="sr-only">编辑知识库</span>
            </Button>
          </div>
          {knowledgeBase.description && (
            <p className="text-muted-foreground max-w-3xl">
              {knowledgeBase.description}
            </p>
          )}
          <div className="flex items-center gap-4 pt-2">
            <Badge variant="secondary" className="font-normal">
              {knowledgeBase.embeddingModel?.name ?? "未知模型"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {knowledgeBase._count.documents} 篇文档
            </span>
            <span className="text-sm text-muted-foreground">
              {knowledgeBase.chunkCount} 个分块
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Upload */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">上传新文档</h2>
            <DocumentUpload
              knowledgeBaseId={knowledgeBase.id}
              onUploadComplete={handleUploadComplete}
            />
          </div>
        </div>

        {/* Right Column: Document List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
            <div className="border-b bg-muted/50 p-4">
              <h2 className="text-lg font-semibold">所有文档</h2>
            </div>
            <div className="p-0">
              <DocumentTable knowledgeBaseId={knowledgeBase.id} />
            </div>
          </div>
        </div>
      </div>

      <KnowledgeBaseFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        knowledgeBase={knowledgeBase}
        onSuccess={fetchKnowledgeBase}
      />
    </div>
  );
}
