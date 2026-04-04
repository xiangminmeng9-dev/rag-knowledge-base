"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KnowledgeBaseItem } from "./knowledge-base-card";

const knowledgeBaseFormSchema = z.object({
  name: z.string().min(1, "名称为必填项").max(100, "名称过长"),
  description: z.string().max(500, "描述过长").optional(),
  embeddingModelId: z.string().min(1, "请选择 Embedding 模型"),
});

interface EmbeddingModelOption {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  dimensions: number;
  isDefault?: boolean;
}

interface KnowledgeBaseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  knowledgeBase?: KnowledgeBaseItem;
  onSuccess: () => void;
}

export function KnowledgeBaseFormDialog({
  open,
  onOpenChange,
  knowledgeBase,
  onSuccess,
}: KnowledgeBaseFormDialogProps) {
  const isEditMode = !!knowledgeBase;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [embeddingModelId, setEmbeddingModelId] = useState("");
  const [embeddingModels, setEmbeddingModels] = useState<EmbeddingModelOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showReprocessWarning, setShowReprocessWarning] = useState(false);
  const [pendingModelChange, setPendingModelChange] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      // Load embedding models from settings API
      fetch("/api/settings/embedding-models")
        .then((res) => res.json())
        .then((data) => {
          if (data.data) {
            setEmbeddingModels(data.data);
            // Auto-select default or first model if not editing
            if (!isEditMode && data.data.length > 0) {
              const defaultModel = data.data.find(
                (m: EmbeddingModelOption) => m.isDefault
              );
              setEmbeddingModelId(
                defaultModel?.id ?? data.data[0].id
              );
            }
          }
        })
        .catch(() => {
          // Silently fail - user can still type model ID
        });

      if (knowledgeBase) {
        setName(knowledgeBase.name);
        setDescription(knowledgeBase.description ?? "");
        setEmbeddingModelId(knowledgeBase.embeddingModelId);
      } else {
        setName("");
        setDescription("");
      }
      setErrors({});
      setSubmitError(null);
      setShowReprocessWarning(false);
      setPendingModelChange(null);
    }
  }, [open, knowledgeBase, isEditMode]);

  function handleEmbeddingModelChange(newModelId: string | null) {
    if (!newModelId) return;
    if (isEditMode && knowledgeBase && newModelId !== knowledgeBase.embeddingModelId) {
      // Show reprocessing confirmation when changing embedding model in edit mode
      setPendingModelChange(newModelId);
      setShowReprocessWarning(true);
    } else {
      setEmbeddingModelId(newModelId);
      setShowReprocessWarning(false);
      setPendingModelChange(null);
    }
  }

  function confirmModelChange() {
    if (pendingModelChange) {
      setEmbeddingModelId(pendingModelChange);
      setPendingModelChange(null);
      setShowReprocessWarning(false);
    }
  }

  function cancelModelChange() {
    setPendingModelChange(null);
    setShowReprocessWarning(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSubmitError(null);

    const validation = knowledgeBaseFormSchema.safeParse({
      name,
      description: description || undefined,
      embeddingModelId,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const url = isEditMode
        ? `/api/knowledge-bases/${knowledgeBase.id}`
        : "/api/knowledge-bases";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          embeddingModelId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSubmitError(data.error ?? "保存知识库失败");
        return;
      }

      onSuccess();
      onOpenChange(false);
    } catch {
      setSubmitError("发生未知错误");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "编辑知识库" : "新建知识库"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "更新知识库的基本设置。"
              : "创建一个新的知识库来组织您的文档。"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="kb-name">名称</Label>
            <Input
              id="kb-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入知识库名称"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="kb-description">描述</Label>
            <Textarea
              id="kb-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="请输入描述（选填）"
              disabled={isSubmitting}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Embedding 模型 (向量模型)</Label>
            {embeddingModels.length > 0 ? (
              <Select
                value={embeddingModelId}
                onValueChange={handleEmbeddingModelChange}
                disabled={isSubmitting}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="请选择 Embedding 模型">
                    {embeddingModelId ? (() => {
                      const model = embeddingModels.find(m => m.id === embeddingModelId);
                      return model ? `${model.name} (${model.provider} - ${model.dimensions}d)` : embeddingModelId;
                    })() : "请选择 Embedding 模型"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {embeddingModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name} ({model.provider} - {model.dimensions}d)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={embeddingModelId}
                onChange={(e) => setEmbeddingModelId(e.target.value)}
                placeholder="请输入 Embedding 模型 ID"
                disabled={isSubmitting}
              />
            )}
            {errors.embeddingModelId && (
              <p className="text-sm text-destructive">
                {errors.embeddingModelId}
              </p>
            )}
          </div>

          {showReprocessWarning && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm dark:border-yellow-700 dark:bg-yellow-900/20">
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                更改 Embedding 模型将需要重新处理该知识库中的所有文档。
              </p>
              <p className="mt-1 text-yellow-700 dark:text-yellow-300">
                现有的向量数据将失效，所有文档都需要使用新模型重新进行向量化。
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={confirmModelChange}
                >
                  确认更改
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={cancelModelChange}
                >
                  取消
                </Button>
              </div>
            </div>
          )}

          {submitError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || showReprocessWarning}>
              {isSubmitting
                ? "保存中..."
                : isEditMode
                  ? "保存更改"
                  : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
