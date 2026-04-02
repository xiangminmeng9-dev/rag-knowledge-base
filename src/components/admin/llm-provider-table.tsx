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
import { Plus, Pencil, Trash2 } from "lucide-react";

interface LLMProvider {
  id: string;
  name: string;
  apiBaseUrl: string;
  modelId: string;
  isActive: boolean;
}

interface FormData {
  name: string;
  apiBaseUrl: string;
  apiKey: string;
  modelId: string;
  isActive: boolean;
}

const emptyForm: FormData = {
  name: "",
  apiBaseUrl: "",
  apiKey: "",
  modelId: "",
  isActive: false,
};

export default function LLMProviderTable() {
  const [providers, setProviders] = React.useState<LLMProvider[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [editingProvider, setEditingProvider] = React.useState<LLMProvider | null>(null);
  const [deletingProvider, setDeletingProvider] = React.useState<LLMProvider | null>(null);
  const [formData, setFormData] = React.useState<FormData>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState("");

  const fetchProviders = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/llm-providers");
      if (res.ok) {
        const json = await res.json();
        setProviders(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch LLM providers:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchProviders();
  }, [fetchProviders]);

  const handleAdd = () => {
    setEditingProvider(null);
    setFormData(emptyForm);
    setApiError("");
    setDialogOpen(true);
  };

  const handleEdit = (provider: LLMProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      apiBaseUrl: provider.apiBaseUrl,
      apiKey: "",
      modelId: provider.modelId,
      isActive: provider.isActive,
    });
    setApiError("");
    setDialogOpen(true);
  };

  const handleDeleteClick = (provider: LLMProvider) => {
    setDeletingProvider(provider);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProvider) return;
    try {
      const res = await fetch(`/api/settings/llm-providers/${deletingProvider.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteDialogOpen(false);
        setDeletingProvider(null);
        void fetchProviders();
      } else {
        const json = await res.json();
        alert(json.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete provider:", error);
    }
  };

  const handleToggleActive = async (provider: LLMProvider) => {
    try {
      const res = await fetch(`/api/settings/llm-providers/${provider.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !provider.isActive }),
      });
      if (res.ok) {
        void fetchProviders();
      } else {
        const json = await res.json();
        alert(json.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to toggle provider active status:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setSubmitting(true);

    try {
      const isEditing = !!editingProvider;
      const url = isEditing
        ? `/api/settings/llm-providers/${editingProvider.id}`
        : "/api/settings/llm-providers";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        name: formData.name,
        apiBaseUrl: formData.apiBaseUrl,
        modelId: formData.modelId,
        isActive: formData.isActive,
      };

      // Only send apiKey if provided (required for create, optional for update)
      if (formData.apiKey) {
        body.apiKey = formData.apiKey;
      } else if (!isEditing) {
        setApiError("API Key不能为空");
        setSubmitting(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setDialogOpen(false);
        void fetchProviders();
      } else {
        const json = await res.json();
        setApiError(json.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to submit provider form:", error);
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
          添加提供商
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>API Base URL</TableHead>
              <TableHead>模型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  加载中...
                </TableCell>
              </TableRow>
            ) : providers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  暂无LLM提供商配置
                </TableCell>
              </TableRow>
            ) : (
              providers.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell className="font-medium">{provider.name}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {provider.apiBaseUrl}
                  </TableCell>
                  <TableCell>{provider.modelId}</TableCell>
                  <TableCell>
                    <Badge variant={provider.isActive ? "default" : "secondary"}>
                      {provider.isActive ? "已激活" : "未激活"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Switch
                        size="sm"
                        checked={provider.isActive}
                        onCheckedChange={() => void handleToggleActive(provider)}
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleEdit(provider)}
                        title="编辑"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteClick(provider)}
                        title="删除"
                        disabled={provider.isActive}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProvider ? "编辑 LLM 模型配置" : "添加 LLM 模型"}
            </DialogTitle>
            <DialogDescription>
              {editingProvider
                ? "修改大语言模型接口和密钥配置"
                : "添加一个新的大语言模型接口"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">模型名称</Label>
              <Input
                id="provider-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="例如: DeepSeek 或 OpenAI"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-url">API Base URL (接口地址)</Label>
              <Input
                id="provider-url"
                value={formData.apiBaseUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiBaseUrl: e.target.value }))
                }
                placeholder="例如: https://api.deepseek.com/v1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-key">
                API Key (密钥)
                {editingProvider && (
                  <span className="text-muted-foreground">（留空则不修改）</span>
                )}
              </Label>
              <Input
                id="provider-key"
                type="password"
                value={formData.apiKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder={
                  editingProvider ? "留空则保持原有密钥" : "请输入以 sk- 开头的密钥"
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider-model">模型ID</Label>
              <Input
                id="provider-model"
                value={formData.modelId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, modelId: e.target.value }))
                }
                placeholder="例如: gpt-4o"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="provider-active"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, isActive: checked }))
                }
              />
              <Label htmlFor="provider-active">设为激活状态</Label>
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
                {submitting ? "提交中..." : editingProvider ? "保存" : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除提供商 &quot;{deletingProvider?.name}&quot; 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
