import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, docId } = await params;

  try {
    const document = await prisma.document.findUnique({
      where: { id: docId },
      select: {
        id: true,
        status: true,
        chunkCount: true,
        errorMessage: true,
        processedAt: true,
        knowledgeBaseId: true,
      },
    });

    if (!document || document.knowledgeBaseId !== id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: document.id,
        status: document.status,
        chunkCount: document.chunkCount,
        errorMessage: document.errorMessage,
        processedAt: document.processedAt,
      },
    });
  } catch (error) {
    console.error("Failed to fetch document status:", error);
    return NextResponse.json(
      { error: "Failed to fetch document status" },
      { status: 500 }
    );
  }
}
