import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, apiError, apiSuccess, validateRequest } from "@/lib/utils";

const updateUserSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少2个字符")
    .max(50, "用户名最多50个字符")
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线和中文")
    .optional(),
  password: z.string().min(8, "密码至少8个字符").optional(),
  role: z
    .enum(["SUPER_ADMIN", "KB_ADMIN", "QA_USER"], {
      error: "无效的角色",
    })
    .optional(),
  status: z
    .enum(["ACTIVE", "DISABLED"], {
      error: "无效的状态",
    })
    .optional(),
  knowledgeBaseIds: z.array(z.string()).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const currentUser = session.user as { id: string; name?: string | null; role: string };

  if (currentUser.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  const { id } = await params;

  try {
    const body: unknown = await request.json();
    const validation = validateRequest(updateUserSchema, body);

    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { username, password, role, status, knowledgeBaseIds } = validation.data;

    // Check that the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return apiError("用户不存在", 404);
    }

    // Prevent disabling the last SUPER_ADMIN
    if (
      (status === "DISABLED" || (role && role !== "SUPER_ADMIN")) &&
      targetUser.role === "SUPER_ADMIN"
    ) {
      const superAdminCount = await prisma.user.count({
        where: {
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          id: { not: id },
        },
      });

      if (superAdminCount === 0) {
        return apiError("不能禁用或降级最后一个超级管理员", 400);
      }
    }

    // Check username uniqueness if changing
    if (username && username !== targetUser.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return apiError("用户名已存在", 409);
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.passwordHash = await hashPassword(password);
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;

    // Update user and KB access in a transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      // Update knowledge base access if provided
      if (knowledgeBaseIds !== undefined) {
        await tx.userKnowledgeBaseAccess.deleteMany({
          where: { userId: id },
        });

        if (knowledgeBaseIds.length > 0) {
          await tx.userKnowledgeBaseAccess.createMany({
            data: knowledgeBaseIds.map((kbId) => ({
              id: crypto.randomUUID(),
              userId: id,
              knowledgeBaseId: kbId,
            })),
          });
        }
      }

      return tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          UserKnowledgeBaseAccess: {
            select: {
              knowledgeBaseId: true,
              KnowledgeBase: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });
    });

    return apiSuccess(updatedUser);
  } catch (error) {
    console.error("Failed to update user:", error);
    return apiError("Failed to update user", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const currentUser = session.user as { id: string; role: string };

  if (currentUser.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  const { id } = await params;

  // Cannot delete yourself
  if (id === currentUser.id) {
    return apiError("不能删除自己的账号", 400);
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id } });

    if (!targetUser) {
      return apiError("用户不存在", 404);
    }

    // Prevent deleting the last SUPER_ADMIN
    if (targetUser.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.user.count({
        where: { role: "SUPER_ADMIN", id: { not: id } },
      });
      if (superAdminCount === 0) {
        return apiError("不能删除最后一个超级管理员", 400);
      }
    }

    // Delete user (cascades will handle related records)
    await prisma.user.delete({ where: { id } });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return apiError("删除用户失败", 500);
  }
}
