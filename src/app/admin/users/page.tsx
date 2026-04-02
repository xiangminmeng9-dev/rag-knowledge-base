"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon } from "lucide-react";
import UserTable from "@/components/admin/user-table";
import UserFormDialog from "@/components/admin/user-form-dialog";
import type { UserRecord } from "@/components/admin/user-table";

export default function UsersPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRecord | null>(null);

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    window.dispatchEvent(new Event("users-updated"));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">用户</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理用户、角色与知识库权限
          </p>
        </div>
        <Button onClick={handleCreate} className="shrink-0">
          <Plus className="size-4" />
          新建
        </Button>
      </div>

      {/* User Table */}
      <UserTable onEdit={handleEdit} />

      {/* User Form Dialog */}
      <UserFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={editingUser}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
