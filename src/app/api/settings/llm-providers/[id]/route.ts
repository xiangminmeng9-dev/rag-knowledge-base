import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess, validateRequest } from "@/lib/utils";

const updateProviderSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100, "名称最多100个字符").optional(),
  apiBaseUrl: z.string().url("请输入有效的URL").optional(),
  apiKey: z.string().min(1, "API Key不能为空").optional(),
  modelId: z.string().min(1, "模型ID不能为空").optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const user = session.user as { id: string; name?: string | null; role: string };

  if (user.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  const { id } = await params;

  try {
    const body: unknown = await request.json();
    const validation = validateRequest(updateProviderSchema, body);

    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const data = validation.data;

    // Check that the provider exists
    const existing = await prisma.lLMProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("LLM provider not found", 404);
    }

    // Build update data, excluding apiKey if not provided
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.apiBaseUrl !== undefined) updateData.apiBaseUrl = data.apiBaseUrl;
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
    if (data.modelId !== undefined) updateData.modelId = data.modelId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const provider = await prisma.$transaction(async (tx) => {
      // If setting this provider as active, deactivate all others
      if (data.isActive === true) {
        await tx.lLMProvider.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }

      return tx.lLMProvider.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          apiBaseUrl: true,
          modelId: true,
          isActive: true,
        },
      });
    });

    return apiSuccess(provider);
  } catch (error) {
    console.error("Failed to update LLM provider:", error);
    return apiError("Failed to update LLM provider", 500);
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

  const user = session.user as { id: string; name?: string | null; role: string };

  if (user.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  const { id } = await params;

  try {
    const existing = await prisma.lLMProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return apiError("LLM provider not found", 404);
    }

    if (existing.isActive) {
      return apiError("无法删除当前激活的LLM提供商，请先切换到其他提供商", 400);
    }

    await prisma.lLMProvider.delete({
      where: { id },
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    console.error("Failed to delete LLM provider:", error);
    return apiError("Failed to delete LLM provider", 500);
  }
}
