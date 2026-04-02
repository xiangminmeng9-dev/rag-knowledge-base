import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };

  try {
    const { searchParams } = new URL(request.url);
    const knowledgeBaseId = searchParams.get("knowledgeBaseId");

    const where: {
      userId: string;
      knowledgeBaseId?: string;
    } = { userId: user.id };

    if (knowledgeBaseId) {
      where.knowledgeBaseId = knowledgeBaseId;
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        KnowledgeBase: {
          select: { name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ data: conversations });
  } catch (error) {
    console.error("Failed to fetch conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { id: string; role: string };

  try {
    const body = (await request.json()) as { knowledgeBaseId?: string };
    const { knowledgeBaseId } = body;

    if (!knowledgeBaseId) {
      return NextResponse.json(
        { error: "knowledgeBaseId is required" },
        { status: 400 }
      );
    }

    // Verify user has access to this knowledge base
    if (user.role === "QA_USER") {
      const access = await prisma.userKnowledgeBaseAccess.findUnique({
        where: {
          userId_knowledgeBaseId: {
            userId: user.id,
            knowledgeBaseId,
          },
        },
      });

      if (!access) {
        return NextResponse.json(
          { error: "You do not have access to this knowledge base" },
          { status: 403 }
        );
      }
    } else {
      // SUPER_ADMIN / KB_ADMIN: verify the knowledge base exists
      const kb = await prisma.knowledgeBase.findUnique({
        where: { id: knowledgeBaseId },
      });

      if (!kb) {
        return NextResponse.json(
          { error: "Knowledge base not found" },
          { status: 404 }
        );
      }
    }

    // Check knowledge base has at least one COMPLETED document
    const completedDocCount = await prisma.document.count({
      where: {
        knowledgeBaseId,
        status: "COMPLETED",
      },
    });

    if (completedDocCount === 0) {
      return NextResponse.json(
        { error: "Knowledge base has no completed documents to chat with" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        knowledgeBaseId,
        updatedAt: new Date(),
      },
      include: {
        KnowledgeBase: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ data: conversation }, { status: 201 });
  } catch (error) {
    console.error("Failed to create conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
