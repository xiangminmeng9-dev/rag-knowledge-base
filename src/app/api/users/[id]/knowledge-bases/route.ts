import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
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
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return apiError("用户不存在", 404);
    }

    const accessList = await prisma.userKnowledgeBaseAccess.findMany({
      where: { userId: id },
      include: {
        KnowledgeBase: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const knowledgeBases = accessList.map((access) => access.KnowledgeBase);

    return NextResponse.json({ data: knowledgeBases });
  } catch (error) {
    console.error("Failed to fetch user knowledge bases:", error);
    return apiError("Failed to fetch user knowledge bases", 500);
  }
}
