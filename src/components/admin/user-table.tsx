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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Ban, CheckCircle, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface KnowledgeBaseAccess {
  knowledgeBaseId: string;
  knowledgeBase: {
    id: string;
    name: string;
  };
}

export interface UserRecord {
  id: string;
  username: string;
  role: "SUPER_ADMIN" | "KB_ADMIN" | "QA_USER";
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
  knowledgeBaseAccess: KnowledgeBaseAccess[];
}

interface UserTableProps {
  onEdit: (user: UserRecord) => void;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "超级管理员",
  KB_ADMIN: "知识库管理员",
  QA_USER: "普通用户",
};

const roleBadgeVariant: Record<string, "default" | "secondary" | "outline"> = {
  SUPER_ADMIN: "default",
  KB_ADMIN: "secondary",
  QA_USER: "outline",
};

export default function UserTable({ onEdit }: UserTableProps) {
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [roleFilter, setRoleFilter] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.data);
        setTotal(json.total);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, roleFilter, statusFilter]);

  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  // Expose refresh function via a custom event pattern
  React.useEffect(() => {
    const handler = () => {
      void fetchUsers();
    };
    window.addEventListener("users-updated", handler);
    return () => window.removeEventListener("users-updated", handler);
  }, [fetchUsers]);

  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`确定要删除用户「${user.username}」吗？此操作不可恢复。`)) {
      return;
    }
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        void fetchUsers();
      } else {
        const json = await res.json();
        alert(json.error || "删除失败");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  const handleToggleStatus = async (user: UserRecord) => {
    const newStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        void fetchUsers();
      } else {
        const json = await res.json();
        alert(json.error || "操作失败");
      }
    } catch (error) {
      console.error("Failed to toggle user status:", error);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">角色:</span>
          <Select
            value={roleFilter || "all"}
            onValueChange={(val) => {
              setRoleFilter(val === "all" ? "" : (val ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="全部角色">
                {{
                  all: "全部角色",
                  SUPER_ADMIN: "超级管理员",
                  KB_ADMIN: "知识库管理员",
                  QA_USER: "普通用户",
                }[roleFilter || "all"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              <SelectItem value="SUPER_ADMIN">超级管理员</SelectItem>
              <SelectItem value="KB_ADMIN">知识库管理员</SelectItem>
              <SelectItem value="QA_USER">普通用户</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">状态:</span>
          <Select
            value={statusFilter || "all"}
            onValueChange={(val) => {
              setStatusFilter(val === "all" ? "" : (val ?? ""));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="全部状态">
                {{
                  all: "全部状态",
                  ACTIVE: "启用",
                  DISABLED: "禁用",
                }[statusFilter || "all"]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="ACTIVE">启用</SelectItem>
              <SelectItem value="DISABLED">禁用</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
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
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  暂无用户数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[u.role] ?? "outline"}>
                      {roleLabels[u.role] ?? u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={u.status === "ACTIVE" ? "secondary" : "destructive"}
                    >
                      {u.status === "ACTIVE" ? "启用" : "禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => onEdit(u)}
                        title="编辑"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void handleToggleStatus(u)}
                        title={u.status === "ACTIVE" ? "禁用" : "启用"}
                      >
                        {u.status === "ACTIVE" ? (
                          <Ban className="size-4" />
                        ) : (
                          <CheckCircle className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => void handleDelete(u)}
                        title="删除"
                        className="text-destructive hover:text-destructive"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page}/{totalPages} 页
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
