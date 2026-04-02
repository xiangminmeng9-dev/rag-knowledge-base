import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const embeddingModels = await prisma.embeddingModel.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
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
