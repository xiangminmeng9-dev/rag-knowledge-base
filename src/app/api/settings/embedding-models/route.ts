import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

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

  if (user.role !== "SUPER_ADMIN" && user.role !== "KB_ADMIN") {
    return NextResponse.json(
      { error: "权限不足" },
      { status: 403 }
    );
  }

  try {
    const embeddingModels = await prisma.embeddingModel.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        modelId: true,
        dimensions: true,
        isDefault: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ data: embeddingModels });
  } catch (error) {
    console.error("Failed to fetch embedding models:", error);
    return NextResponse.json(
      { error: "Failed to fetch embedding models" },
      { status: 500 }
    );
  }
}

const createEmbeddingModelSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  provider: z.string().min(1, "Provider is required"),
  modelId: z.string().min(1, "Model ID is required"),
  dimensions: z.number().int().positive("Dimensions must be a positive integer"),
  isDefault: z.boolean().optional().default(false),
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

  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "权限不足：需要超级管理员权限" },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();
    const validation = createEmbeddingModelSchema.safeParse(body);

    if (!validation.success) {
      const errorMessage = validation.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { name, provider, modelId, dimensions, isDefault } = validation.data;

    // Check name uniqueness
    const existing = await prisma.embeddingModel.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An embedding model with this name already exists" },
        { status: 409 }
      );
    }

    // If this model is set as default, unset all other defaults first
    if (isDefault) {
      await prisma.embeddingModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const embeddingModel = await prisma.embeddingModel.create({
      data: {
        id: crypto.randomUUID(),
        name,
        provider,
        modelId,
        dimensions,
        isDefault,
      },
      select: {
        id: true,
        name: true,
        provider: true,
        modelId: true,
        dimensions: true,
        isDefault: true,
      },
    });

    return NextResponse.json({ data: embeddingModel }, { status: 201 });
  } catch (error) {
    console.error("Failed to create embedding model:", error);
    return NextResponse.json(
      { error: "Failed to create embedding model" },
      { status: 500 }
    );
  }
}
