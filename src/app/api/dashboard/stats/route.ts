import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess } from "@/lib/utils";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return apiError("Unauthorized", 401);
  }

  const user = session.user as { id: string; name?: string | null; role: string };

  if (user.role !== "SUPER_ADMIN" && user.role !== "KB_ADMIN") {
    return apiError("Forbidden: SUPER_ADMIN or KB_ADMIN access required", 403);
  }

  try {
    const [
      knowledgeBaseCount,
      documentCount,
      userCount,
      chunkCount,
      documentsByStatusRaw,
      documentsByFormatRaw,
      recentActivities,
    ] = await Promise.all([
      prisma.knowledgeBase.count(),
      prisma.document.count(),
      prisma.user.count(),
      prisma.chunk.count(),
      prisma.document.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      prisma.document.groupBy({
        by: ["fileFormat"],
        _count: { fileFormat: true },
      }),
      prisma.document.findMany({
        take: 10,
        orderBy: { uploadedAt: "desc" },
        select: {
          fileName: true,
          fileFormat: true,
          status: true,
          uploadedAt: true,
          KnowledgeBase: {
            select: { name: true },
          },
        },
      }),
    ]);

    const documentsByStatus = documentsByStatusRaw.map((item) => ({
      status: item.status,
      count: item._count.status,
    }));

    const documentsByFormat = documentsByFormatRaw.map((item) => ({
      format: item.fileFormat,
      count: item._count.fileFormat,
    }));

    const activities = recentActivities.map((doc) => ({
      fileName: doc.fileName,
      fileFormat: doc.fileFormat,
      status: doc.status,
      uploadedAt: doc.uploadedAt,
      knowledgeBaseName: doc.KnowledgeBase.name,
    }));

    return apiSuccess({
      knowledgeBaseCount,
      documentCount,
      userCount,
      chunkCount,
      documentsByStatus,
      documentsByFormat,
      recentActivities: activities,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return apiError("Failed to fetch dashboard stats", 500);
  }
}
