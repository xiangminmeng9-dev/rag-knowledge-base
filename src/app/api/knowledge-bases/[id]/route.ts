import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { deleteCollection } from "@/lib/rag/vector-store";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        EmbeddingModel: true,
        _count: {
          select: {
            Document: true,
          },
        },
      },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: "未找到知识库" },
        { status: 404 }
      );
    }

    // Get chunk count across all documents
    const chunkCount = await prisma.chunk.count({
      where: {
        Document: {
          knowledgeBaseId: id,
        },
      },
    });

    return NextResponse.json({
      data: {
        ...knowledgeBase,
        embeddingModel: knowledgeBase.EmbeddingModel,
        EmbeddingModel: undefined,
        _count: { documents: knowledgeBase._count.Document },
        chunkCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch knowledge base:", error);
    return NextResponse.json(
      { error: "获取知识库失败" },
      { status: 500 }
    );
  }
}

const updateKnowledgeBaseSchema = z.object({
  name: z.string().min(1, "名称为必填项").max(100, "名称过长").optional(),
  description: z.string().max(500, "描述过长").optional(),
  embeddingModelId: z.string().min(1, "请选择 Embedding 模型").optional(),
});

export async function PUT(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    role: string;
  };

  if (user.role !== "SUPER_ADMIN" && user.role !== "KB_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body: unknown = await request.json();
    const validation = updateKnowledgeBaseSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const existing = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "未找到知识库" },
        { status: 404 }
      );
    }

    const { name, description, embeddingModelId } = validation.data;

    // Check if embedding model is being changed
    let requiresReprocessing = false;
    if (embeddingModelId && embeddingModelId !== existing.embeddingModelId) {
      const newModel = await prisma.embeddingModel.findUnique({
        where: { id: embeddingModelId },
      });

      if (!newModel) {
        return NextResponse.json(
          { error: "未找到 Embedding 模型" },
          { status: 404 }
        );
      }
      requiresReprocessing = true;
    }

    const knowledgeBase = await prisma.knowledgeBase.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(embeddingModelId !== undefined && { embeddingModelId }),
        updatedAt: new Date(),
      },
      include: {
        EmbeddingModel: true,
        _count: {
          select: { Document: true },
        },
      },
    });

    return NextResponse.json({
      data: {
        ...knowledgeBase,
        embeddingModel: knowledgeBase.EmbeddingModel,
        EmbeddingModel: undefined,
        _count: { documents: knowledgeBase._count.Document },
        requiresReprocessing,
      },
    });
  } catch (error) {
    console.error("Failed to update knowledge base:", error);
    return NextResponse.json(
      { error: "更新知识库失败" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    role: string;
  };

  if (user.role !== "SUPER_ADMIN" && user.role !== "KB_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: "未找到知识库" },
        { status: 404 }
      );
    }

    // Delete Chroma collection
    try {
      await deleteCollection(knowledgeBase.chromaCollectionName);
    } catch (chromaError) {
      console.warn("Failed to delete Chroma collection:", chromaError);
      // Continue with database deletion even if Chroma fails
    }

    // Cascade delete: documents, chunks, access records, conversations
    // Prisma onDelete: Cascade handles chunks, userAccess, conversations, messages
    await prisma.knowledgeBase.delete({
      where: { id },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Failed to delete knowledge base:", error);
    return NextResponse.json(
      { error: "删除知识库失败" },
      { status: 500 }
    );
  }
}
