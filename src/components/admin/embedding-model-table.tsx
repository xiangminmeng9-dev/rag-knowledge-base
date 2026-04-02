"use client";

import * as React from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";

interface EmbeddingModel {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  dimensions: number;
  isDefault: boolean;
}

interface FormData {
  name: string;
  provider: string;
  modelId: string;
  dimensions: string;
  isDefault: boolean;
}

const emptyForm: FormData = {
  name: "",
  provider: "",
  modelId: "",
  dimensions: "",
  isDefault: false,
};

export default function EmbeddingModelTable() {
  const [models, setModels] = React.useState<EmbeddingModel[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState("");

  const fetchModels = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/embedding-models");
      if (res.ok) {
        const json = await res.json();
        setModels(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch embedding models:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchModels();
  }, [fetchModels]);

  const handleAdd = () => {
    setFormData(emptyForm);
    setApiError("");
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    const dimensions = parseInt(formData.dimensions, 10);
    if (isNaN(dimensions) || dimensions <= 0) {
      setApiError("维度必须为正整数");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/settings/embedding-models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          provider: formData.provider,
          modelId: formData.modelId,
          dimensions,
          isDefault: formData.isDefault,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        void fetchModels();
      } else {
        const json = await res.json();
        setApiError(json.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to create embedding model:", error);
      setApiError("请求失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={handleAdd}>
          <Plus className="size-4" data-icon="inline-start" />
          添加模型
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>提供商</TableHead>
              <TableHead>模型ID</TableHead>
              <TableHead>维度</TableHead>
              <TableHead>默认</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : models.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  暂无Embedding模型配置
                </TableCell>
              </TableRow>
            ) : (
              models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="font-medium">{model.name}</TableCell>
                  <TableCell>{model.provider}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {model.modelId}
                  </TableCell>
                  <TableCell>{model.dimensions}</TableCell>
                  <TableCell>
                    <Badge variant={model.isDefault ? "default" : "secondary"}>
                      {model.isDefault ? "默认" : "-"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加Embedding模型</DialogTitle>
            <DialogDescription>
              添加新的Embedding模型配置
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="model-name">名称</Label>
              <Input
                id="model-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="例如: text-embedding-3-small"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-provider">提供商</Label>
              <Input
                id="model-provider"
                value={formData.provider}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, provider: e.target.value }))
                }
                placeholder="例如: OpenAI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-id">模型ID</Label>
              <Input
                id="model-id"
                value={formData.modelId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, modelId: e.target.value }))
                }
                placeholder="例如: text-embedding-3-small"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-dimensions">维度</Label>
              <Input
                id="model-dimensions"
                type="number"
                value={formData.dimensions}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dimensions: e.target.value }))
                }
                placeholder="例如: 1536"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="model-default"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isDefault: checked }))
                }
              />
              <Label htmlFor="model-default">设为默认模型</Label>
            </div>

            {apiError && (
              <p className="text-sm text-destructive">{apiError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "提交中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
