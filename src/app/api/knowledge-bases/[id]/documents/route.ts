import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { waitUntil } from "@vercel/functions";

import { FileFormat, DocumentStatus, ChunkStrategy } from "@/types";

// Allow up to 60s for document upload + processing (Vercel Hobby max)
export const maxDuration = 60;

interface RouteParams {
  params: Promise<{ id: string }>;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const FORMAT_MAP: Record<string, FileFormat> = {
  "application/pdf": FileFormat.PDF,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    FileFormat.DOCX,
  "text/plain": FileFormat.TXT,
  "text/markdown": FileFormat.MD,
};

const EXTENSION_MAP: Record<string, FileFormat> = {
  ".pdf": FileFormat.PDF,
  ".docx": FileFormat.DOCX,
  ".txt": FileFormat.TXT,
  ".md": FileFormat.MD,
};

function detectFileFormat(
  fileName: string,
  mimeType: string
): FileFormat | null {
  // Try MIME type first
  if (FORMAT_MAP[mimeType]) {
    return FORMAT_MAP[mimeType];
  }

  // Fall back to extension
  const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
  return EXTENSION_MAP[ext] ?? null;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(url.searchParams.get("pageSize") ?? "20", 10))
    );
    const statusFilter = url.searchParams.get("status") as DocumentStatus | null;

    const where = {
      knowledgeBaseId: id,
      ...(statusFilter && { status: statusFilter }),
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      data: documents,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return NextResponse.json(
      { error: "获取文档列表失败" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: RouteParams) {
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

    let realFileName: string;
    let fileSize: number;
    let mimeType: string;
    let fileBuffer: Buffer;
    let chunkStrategyRaw: string | null = null;
    let chunkOverlapPercentRaw: string | null = null;
    let chunkSizeRaw: string | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      // JSON + Base64 upload (Safari-safe)
      const body = await request.json();
      if (!body.fileBase64 || !body.fileName) {
        return NextResponse.json({ error: "未提供文件" }, { status: 400 });
      }
      realFileName = body.fileName;
      mimeType = body.fileType || "";
      fileBuffer = Buffer.from(body.fileBase64, "base64");
      fileSize = fileBuffer.length;
      chunkStrategyRaw = body.chunkStrategy ?? null;
      chunkOverlapPercentRaw = body.chunkOverlapPercent != null ? String(body.chunkOverlapPercent) : null;
      chunkSizeRaw = body.chunkSize != null ? String(body.chunkSize) : null;
    } else {
      // FormData upload (standard)
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const encodedOriginalName = formData.get("originalName") as string | null;
      const originalName = encodedOriginalName ? decodeURIComponent(encodedOriginalName) : null;

      if (!file) {
        return NextResponse.json({ error: "未提供文件" }, { status: 400 });
      }
      realFileName = originalName || file.name;
      fileSize = file.size;
      mimeType = file.type;
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
      chunkStrategyRaw = formData.get("chunkStrategy") as string | null;
      chunkOverlapPercentRaw = formData.get("chunkOverlapPercent") as string | null;
      chunkSizeRaw = formData.get("chunkSize") as string | null;
    }

    if (fileBuffer.length === 0) {
      return NextResponse.json({ error: "文件为空" }, { status: 400 });
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "文件大小超过 50MB 限制" },
        { status: 400 }
      );
    }

    const fileFormat = detectFileFormat(realFileName, mimeType);
    if (!fileFormat) {
      return NextResponse.json(
        { error: "不支持的文件格式。接受的格式：PDF、DOCX、TXT、MD" },
        { status: 400 }
      );
    }

    // Save file to /tmp for serverless environments (Vercel)
    const uploadsDir = join("/tmp", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const safeFileName = realFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const savedFileName = `${uniqueSuffix}_${safeFileName}`;
    const filePath = join(uploadsDir, savedFileName);

    await writeFile(filePath, fileBuffer);

    // Parse chunk configuration
    const validStrategies: string[] = Object.values(ChunkStrategy);
    const chunkStrategy =
      chunkStrategyRaw && validStrategies.includes(chunkStrategyRaw)
        ? (chunkStrategyRaw as ChunkStrategy)
        : undefined;
    const chunkOverlapPercent = chunkOverlapPercentRaw
      ? Math.min(50, Math.max(0, parseInt(chunkOverlapPercentRaw, 10)))
      : undefined;
    const chunkSize = chunkSizeRaw
      ? Math.min(5000, Math.max(100, parseInt(chunkSizeRaw, 10)))
      : undefined;

    // Create Document record
    const document = await prisma.document.create({
      data: {
        id: crypto.randomUUID(),
        knowledgeBaseId: id,
        fileName: realFileName,
        fileFormat,
        fileSize,
        filePath,
        status: "UPLOADING",
        ...(chunkStrategy && { chunkStrategy }),
        ...(chunkOverlapPercent !== undefined && { chunkOverlapPercent }),
        ...(chunkSize !== undefined && { chunkSize }),
      },
    });

    // Process document in background using Vercel's waitUntil()
    try {
      const processorPromise = import("@/lib/rag/document-processor").then(mod => {
        return mod.processDocument(document.id).catch(err => {
          console.error(`Background document processing failed for ${document.id}:`, err);
        });
      }).catch(err => {
        console.error(`Failed to import document processor for ${document.id}:`, err);
      });
      waitUntil(processorPromise);
    } catch (processError) {
      console.error(`Failed to trigger waitUntil for ${document.id}:`, processError);
    }

    const updatedDoc = await prisma.document.findUnique({
      where: { id: document.id },
    });

    return NextResponse.json({ data: updatedDoc ?? document }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "上传文档失败";
    console.error("Failed to upload document:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
