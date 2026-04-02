import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess, validateRequest } from "@/lib/utils";

const createProviderSchema = z.object({
  name: z.string().min(1, "名称不能为空").max(100, "名称最多100个字符"),
  apiBaseUrl: z.string().url("请输入有效的URL"),
  apiKey: z.string().min(1, "API Key不能为空"),
  modelId: z.string().min(1, "模型ID不能为空"),
  isActive: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const user = session.user as { id: string; name?: string | null; role: string };

  if (user.role !== "SUPER_ADMIN" && user.role !== "KB_ADMIN") {
    return apiError("权限不足", 403);
  }

  try {
    const providers = await prisma.lLMProvider.findMany({
      select: {
        id: true,
        name: true,
        apiBaseUrl: true,
        modelId: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return apiSuccess(providers);
  } catch (error) {
    console.error("Failed to fetch LLM providers:", error);
    return apiError("Failed to fetch LLM providers", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const user = session.user as { id: string; name?: string | null; role: string };

  if (user.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  try {
    const body: unknown = await request.json();
    const validation = validateRequest(createProviderSchema, body);

    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { name, apiBaseUrl, apiKey, modelId, isActive } = validation.data;

    const provider = await prisma.$transaction(async (tx) => {
      // If this provider should be active, deactivate all others first
      if (isActive) {
        await tx.lLMProvider.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });
      }

      return tx.lLMProvider.create({
        data: {
          id: crypto.randomUUID(),
          name,
          apiBaseUrl,
          apiKey,
          modelId,
          isActive,
        },
        select: {
          id: true,
          name: true,
          apiBaseUrl: true,
          modelId: true,
          isActive: true,
        },
      });
    });

    return apiSuccess(provider, 201);
  } catch (error) {
    console.error("Failed to create LLM provider:", error);
    return apiError("Failed to create LLM provider", 500);
  }
}
