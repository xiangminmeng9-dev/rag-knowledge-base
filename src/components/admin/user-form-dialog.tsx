"use client";

import * as React from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRecord } from "@/components/admin/user-table";

interface KnowledgeBaseOption {
  id: string;
  name: string;
}

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRecord | null;
  onSuccess: () => void;
}

const createSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少2个字符")
    .max(50, "用户名最多50个字符"),
  password: z.string().min(8, "密码至少8个字符"),
  role: z.enum(["SUPER_ADMIN", "KB_ADMIN", "QA_USER"]),
  knowledgeBaseIds: z.array(z.string()),
});

const updateSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少2个字符")
    .max(50, "用户名最多50个字符"),
  password: z
    .string()
    .min(8, "密码至少8个字符")
    .optional()
    .or(z.literal("")),
  role: z.enum(["SUPER_ADMIN", "KB_ADMIN", "QA_USER"]),
  knowledgeBaseIds: z.array(z.string()),
});

export default function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<string>("QA_USER");
  const [selectedKbIds, setSelectedKbIds] = React.useState<string[]>([]);
  const [knowledgeBases, setKnowledgeBases] = React.useState<KnowledgeBaseOption[]>([]);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [apiError, setApiError] = React.useState("");

  // Populate form when editing
  React.useEffect(() => {
    if (open) {
      if (user) {
        setUsername(user.username);
        setPassword("");
        setRole(user.role);
        setSelectedKbIds(
          user.knowledgeBaseAccess.map((a) => a.knowledgeBaseId)
        );
      } else {
        setUsername("");
        setPassword("");
        setRole("QA_USER");
        setSelectedKbIds([]);
      }
      setErrors({});
      setApiError("");
    }
  }, [open, user]);

  // Fetch available knowledge bases
  React.useEffect(() => {
    if (open) {
      void (async () => {
        try {
          const res = await fetch("/api/knowledge-bases");
          if (res.ok) {
            const json = await res.json();
            setKnowledgeBases(
              (json.data as KnowledgeBaseOption[]).map((kb) => ({
                id: kb.id,
                name: kb.name,
              }))
            );
          }
        } catch (error) {
          console.error("Failed to fetch knowledge bases:", error);
        }
      })();
    }
  }, [open]);

  const toggleKb = (kbId: string) => {
    setSelectedKbIds((prev) =>
      prev.includes(kbId) ? prev.filter((id) => id !== kbId) : [...prev, kbId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setApiError("");

    const formData = {
      username,
      password: password || undefined,
      role,
      knowledgeBaseIds: selectedKbIds,
    };

    // Validate
    const schema = isEditing ? updateSchema : createSchema;
    const result = schema.safeParse(
      isEditing ? formData : { ...formData, password }
    );

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field && typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const url = isEditing ? `/api/users/${user.id}` : "/api/users";
      const method = isEditing ? "PUT" : "POST";

      const body: Record<string, unknown> = {
        username,
        role,
        knowledgeBaseIds: selectedKbIds,
      };

      // Only send password if provided
      if (password) {
        body.password = password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSuccess();
        onOpenChange(false);
      } else {
        const json = await res.json();
        setApiError(json.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to submit user form:", error);
      setApiError("请求失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑用户" : "创建用户"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "修改用户信息和权限设置"
              : "创建新用户并分配角色和知识库访问权限"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              autoComplete="off"
            />
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              密码{isEditing && <span className="text-muted-foreground">（留空则不修改）</span>}
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEditing ? "留空则不修改密码" : "请输入密码（至少8位）"}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>角色</Label>
            <Select value={role} onValueChange={(v) => { if (v) setRole(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">超级管理员 (拥有所有权限)</SelectItem>
                <SelectItem value="KB_ADMIN">知识库管理员 (可管理文档)</SelectItem>
                <SelectItem value="QA_USER">普通用户 (只能进行前台问答)</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-xs text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Knowledge Base Multi-select */}
          <div className="space-y-2">
            <Label>知识库访问权限</Label>
            {knowledgeBases.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无可用的知识库</p>
            ) : (
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border p-2">
                {knowledgeBases.map((kb) => {
                  const isSelected = selectedKbIds.includes(kb.id);
                  return (
                    <label
                      key={kb.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleKb(kb.id)}
                        className="size-4 rounded border-input"
                      />
                      <span>{kb.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* API Error */}
          {apiError && (
            <p className="text-sm text-destructive">{apiError}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : isEditing ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
