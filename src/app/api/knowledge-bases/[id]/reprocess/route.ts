import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { deleteCollection, getOrCreateCollection } from "@/lib/rag/vector-store";
import { processDocument } from "@/lib/rag/document-processor";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
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
    // Fetch the knowledge base with its documents
    const knowledgeBase = await prisma.knowledgeBase.findUnique({
      where: { id },
      include: {
        Document: {
          select: { id: true },
        },
      },
    });

    if (!knowledgeBase) {
      return NextResponse.json(
        { error: "未找到知识库" },
        { status: 404 }
      );
    }

    if (knowledgeBase.Document.length === 0) {
      return NextResponse.json(
        { error: "没有可重新处理的文档" },
        { status: 400 }
      );
    }

    // Step 1: Delete old vector data from Chroma (delete collection and recreate)
    try {
      await deleteCollection(knowledgeBase.chromaCollectionName);
    } catch (chromaError) {
      console.warn("Failed to delete Chroma collection during reprocess:", chromaError);
      // Continue - collection may not exist yet
    }

    // Recreate the collection
    await getOrCreateCollection(knowledgeBase.chromaCollectionName);

    // Step 2: Delete all existing chunk records for documents in this KB
    await prisma.chunk.deleteMany({
      where: {
        Document: {
          knowledgeBaseId: id,
        },
      },
    });

    // Step 3: Reset all documents to UPLOADING status
    await prisma.document.updateMany({
      where: { knowledgeBaseId: id },
      data: {
        status: "UPLOADING",
        errorMessage: null,
        chunkCount: 0,
        processedAt: null,
      },
    });

    // Step 4: Trigger document processing pipeline for each document
    // Process documents asynchronously (fire and forget)
    const documentIds = knowledgeBase.Document.map((doc) => doc.id);

    // Start processing without awaiting - runs in background
    Promise.all(
      documentIds.map((docId) =>
        processDocument(docId).catch((error) => {
          console.error(`Failed to reprocess document ${docId}:`, error);
        })
      )
    ).catch((error) => {
      console.error("Reprocessing pipeline error:", error);
    });

    return NextResponse.json({
      data: {
        message: "重新处理已开始",
        documentCount: documentIds.length,
      },
    });
  } catch (error) {
    console.error("Failed to start reprocessing:", error);
    return NextResponse.json(
      { error: "启动重新处理失败" },
      { status: 500 }
    );
  }
}
