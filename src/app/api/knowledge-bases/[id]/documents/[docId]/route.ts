import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { getCollection, deleteFromCollection } from "@/lib/rag/vector-store";

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
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

  const { id, docId } = await params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        KnowledgeBase: true,
        Chunk: {
          select: { id: true },
        },
      },
    });

    if (!document || document.knowledgeBaseId !== id) {
      return NextResponse.json(
        { error: "未找到文档" },
        { status: 404 }
      );
    }

    // Delete vectors from vector store collection
    if (document.Chunk.length > 0) {
      try {
        const collection = await getCollection(
          document.KnowledgeBase.chromaCollectionName
        );
        await deleteFromCollection(collection, `${docId}_chunk_`);
      } catch (vectorError) {
        console.warn("Failed to delete vectors from store:", vectorError);
        // Continue with database deletion even if vector store fails
      }
    }

    // Delete the uploaded file
    try {
      await unlink(document.filePath);
    } catch {
      console.warn("Failed to delete uploaded file:", document.filePath);
    }

    // Delete document from SQLite (cascades to chunks)
    await prisma.document.delete({
      where: { id: docId },
    });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error("Failed to delete document:", error);
    return NextResponse.json(
      { error: "删除文档失败" },
      { status: 500 }
    );
  }
}
