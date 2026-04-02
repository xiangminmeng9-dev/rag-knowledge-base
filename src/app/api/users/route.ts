import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, apiError, apiSuccess, validateRequest } from "@/lib/utils";

const createUserSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少2个字符")
    .max(50, "用户名最多50个字符")
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名只能包含字母、数字、下划线和中文"),
  password: z.string().min(8, "密码至少8个字符"),
  role: z.enum(["SUPER_ADMIN", "KB_ADMIN", "QA_USER"], {
    error: "无效的角色",
  }),
  knowledgeBaseIds: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const user = session.user as { id: string; name?: string | null; role: string };

  if (user.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10", 10)));
    const role = searchParams.get("role");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (role && ["SUPER_ADMIN", "KB_ADMIN", "QA_USER"].includes(role)) {
      where.role = role;
    }
    if (status && ["ACTIVE", "DISABLED"].includes(status)) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return apiError("Failed to fetch users", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const currentUser = session.user as { id: string; name?: string | null; role: string };

  if (currentUser.role !== "SUPER_ADMIN") {
    return apiError("权限不足：需要超级管理员权限", 403);
  }

  try {
    const body: unknown = await request.json();
    const validation = validateRequest(createUserSchema, body);

    if (!validation.success) {
      return apiError(validation.error, 400);
    }

    const { username, password, role, knowledgeBaseIds } = validation.data;

    // Check username uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return apiError("用户名已存在", 409);
    }

    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        username,
        passwordHash,
        role,
        updatedAt: new Date(),
        ...(knowledgeBaseIds && knowledgeBaseIds.length > 0
          ? {
              UserKnowledgeBaseAccess: {
                create: knowledgeBaseIds.map((kbId) => ({
                  id: crypto.randomUUID(),
                  knowledgeBaseId: kbId,
                })),
              },
            }
          : {}),
      },
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

    return apiSuccess(newUser, 201);
  } catch (error) {
    console.error("Failed to create user:", error);
    return apiError("Failed to create user", 500);
  }
}
