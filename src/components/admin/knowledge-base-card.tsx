"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Pencil, Trash2 } from "lucide-react";

export interface KnowledgeBaseItem {
  id: string;
  name: string;
  description: string | null;
  chromaCollectionName: string;
  embeddingModelId: string;
  createdAt: string;
  updatedAt: string;
  embeddingModel: {
    name: string;
  } | null;
  _count: {
    documents: number;
  };
}

interface KnowledgeBaseCardProps {
  knowledgeBase: KnowledgeBaseItem;
  onEdit: (kb: KnowledgeBaseItem) => void;
  onDelete: (kb: KnowledgeBaseItem) => void;
}

export function KnowledgeBaseCard({
  knowledgeBase,
  onEdit,
  onDelete,
}: KnowledgeBaseCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer">
      {/* Subtle gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <CardHeader className="relative pb-3">
        <CardTitle className="text-lg font-semibold truncate">
          {knowledgeBase.name}
        </CardTitle>
        <CardDescription className="line-clamp-2 text-sm">
          {knowledgeBase.description || "暂无描述"}
        </CardDescription>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="size-4" />
            <span>{knowledgeBase._count.documents} 篇文档</span>
          </div>
        </div>

        {/* Model badge */}
        <Badge variant="secondary" className="font-normal">
          {knowledgeBase.embeddingModel?.name ?? "未知模型"}
        </Badge>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(knowledgeBase);
            }}
          >
            <Pencil className="size-3.5" />
            编辑
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(knowledgeBase);
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
