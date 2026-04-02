import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getOrCreateCollection } from "@/lib/rag/vector-store";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as {
    id: string;
    name?: string | null;
    role: string;
  };

  try {
    const where =
      user.role === "QA_USER"
        ? { UserKnowledgeBaseAccess: { some: { userId: user.id } } }
        : undefined;

    const knowledgeBases = await prisma.knowledgeBase.findMany({
      where,
      include: {
        EmbeddingModel: {
          select: { name: true },
        },
        _count: {
          select: { Document: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const normalized = knowledgeBases.map((kb) => ({
      ...kb,
      embeddingModel: kb.EmbeddingModel,
      EmbeddingModel: undefined,
      _count: { documents: kb._count.Document },
    }));

    return NextResponse.json({ data: normalized });
  } catch (error) {
    console.error("Failed to fetch knowledge bases:", error);
    return NextResponse.json(
      { error: "获取知识库列表失败" },
      { status: 500 }
    );
  }
}

const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, "名称为必填项").max(100, "名称过长"),
  description: z.string().max(500, "描述过长").optional(),
  embeddingModelId: z.string().min(1, "请选择 Embedding 模型"),
});

export async function POST(request: Request) {
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

  try {
    const body: unknown = await request.json();
    const validation = createKnowledgeBaseSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { name, description, embeddingModelId } = validation.data;

    // Verify embedding model exists
    const embeddingModel = await prisma.embeddingModel.findUnique({
      where: { id: embeddingModelId },
    });

    if (!embeddingModel) {
      return NextResponse.json(
        { error: "未找到 Embedding 模型" },
        { status: 404 }
      );
    }

    // Auto-generate unique chromaCollectionName
    const chromaCollectionName = `kb_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Create Chroma collection
    await getOrCreateCollection(chromaCollectionName);

    // Create knowledge base record
    const knowledgeBase = await prisma.knowledgeBase.create({
      data: {
        id: crypto.randomUUID(),
        name,
        description,
        embeddingModelId,
        chromaCollectionName,
        updatedAt: new Date(),
      },
      include: {
        EmbeddingModel: {
          select: { name: true },
        },
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
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create knowledge base:", error);
    return NextResponse.json(
      { error: "创建知识库失败" },
      { status: 500 }
    );
  }
}
