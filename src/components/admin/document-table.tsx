"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrashIcon, Loader2Icon } from "lucide-react";

interface DocumentItem {
  id: string;
  fileName: string;
  fileFormat: string;
  fileSize: number;
  status: string;
  chunkStrategy: string;
  chunkCount: number;
  errorMessage: string | null;
  uploadedAt: string;
  processedAt: string | null;
}

interface DocumentTableProps {
  knowledgeBaseId: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PROCESSING":
    case "UPLOADING":
      return "secondary";
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "UPLOADING":
      return "上传中";
    case "PROCESSING":
      return "处理中";
    case "COMPLETED":
      return "已完成";
    case "FAILED":
      return "失败";
    default:
      return status;
  }
}

const STRATEGY_LABELS: Record<string, string> = {
  RECURSIVE: "递归切分",
  SEMANTIC: "语义切分",
  PARAGRAPH: "段落切分",
  FIXED_SIZE: "固定大小",
  SPECIAL_CHAR: "特殊字符",
};

export function DocumentTable({ knowledgeBaseId }: DocumentTableProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/knowledge-bases/${knowledgeBaseId}/documents?pageSize=100`
      );
      const data = await res.json();
      if (data.data) {
        setDocuments(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  }, [knowledgeBaseId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-poll for PROCESSING/UPLOADING status documents
  useEffect(() => {
    const hasProcessing = documents.some(
      (doc) => doc.status === "PROCESSING" || doc.status === "UPLOADING"
    );

    if (hasProcessing) {
      if (!pollTimerRef.current) {
        pollTimerRef.current = setInterval(() => {
          fetchDocuments();
        }, 3000);
      }
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [documents, fetchDocuments]);

  async function handleDelete(docId: string) {
    if (!confirm("您确定要删除此文档吗？")) {
      return;
    }

    setDeletingId(docId);
    try {
      const res = await fetch(
        `/api/knowledge-bases/${knowledgeBaseId}/documents/${docId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      } else {
        const data = await res.json();
        alert(data.error ?? "删除文档失败");
      }
    } catch {
      alert("删除文档失败");
    } finally {
      setDeletingId(null);
    }
  }

  // Expose refresh method for parent
  useEffect(() => {
    const handler = () => fetchDocuments();
    window.addEventListener(`refresh-documents-${knowledgeBaseId}`, handler);
    return () => {
      window.removeEventListener(
        `refresh-documents-${knowledgeBaseId}`,
        handler
      );
    };
  }, [knowledgeBaseId, fetchDocuments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        暂无文档。
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>文件名</TableHead>
          <TableHead>格式</TableHead>
          <TableHead>大小</TableHead>
          <TableHead>切分策略</TableHead>
          <TableHead>上传时间</TableHead>
          <TableHead>状态</TableHead>
          <TableHead className="w-[80px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell className="max-w-[200px] truncate font-medium">
              {doc.fileName}
            </TableCell>
            <TableCell>{doc.fileFormat}</TableCell>
            <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
            <TableCell>
              <span className="text-xs">
                {STRATEGY_LABELS[doc.chunkStrategy] ?? doc.chunkStrategy}
              </span>
            </TableCell>
            <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadgeVariant(doc.status)}>
                  {doc.status === "PROCESSING" && (
                    <Loader2Icon className="mr-1 size-3 animate-spin" />
                  )}
                  {getStatusLabel(doc.status)}
                </Badge>
                {doc.status === "COMPLETED" && doc.chunkCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {doc.chunkCount} 块
                  </span>
                )}
                {doc.status === "FAILED" && doc.errorMessage && (
                  <span
                    className="text-xs text-destructive truncate max-w-[150px]"
                    title={doc.errorMessage}
                  >
                    {doc.errorMessage}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
              >
                {deletingId === doc.id ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <TrashIcon className="size-3.5" />
                )}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
