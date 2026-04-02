"use client";

import * as React from "react";
import StatsCard from "@/components/charts/stats-card";
import DocumentStatusChart from "@/components/charts/document-status-chart";
import DocumentFormatChart from "@/components/charts/document-format-chart";
import RecentActivity from "@/components/charts/recent-activity";
import { Database, FileText, Users, Layers, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  knowledgeBaseCount: number;
  documentCount: number;
  userCount: number;
  chunkCount: number;
  documentsByStatus: Array<{ status: string; count: number }>;
  documentsByFormat: Array<{ format: string; count: number }>;
  recentActivities: Array<{
    fileName: string;
    fileFormat: string;
    status: string;
    uploadedAt: string;
    knowledgeBaseName: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        const json = await res.json();
        setStats(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-destructive">{error || "加载失败"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-sm text-muted-foreground mt-1">
          系统概览与数据统计
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="知识库"
          value={stats.knowledgeBaseCount}
          icon={<Database className="size-5" />}
          accent="from-[oklch(0.55_0.12_35_/_0.12)] to-transparent"
        />
        <StatsCard
          title="文档"
          value={stats.documentCount}
          icon={<FileText className="size-5" />}
          accent="from-[oklch(0.55_0.12_165_/_0.12)] to-transparent"
        />
        <StatsCard
          title="用户"
          value={stats.userCount}
          icon={<Users className="size-5" />}
          accent="from-[oklch(0.55_0.12_290_/_0.12)] to-transparent"
        />
        <StatsCard
          title="向量块"
          value={stats.chunkCount}
          icon={<Layers className="size-5" />}
          accent="from-[oklch(0.55_0.12_210_/_0.12)] to-transparent"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">文档状态</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentStatusChart data={stats.documentsByStatus} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">格式分布</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentFormatChart data={stats.documentsByFormat} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">最近动态</CardTitle>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <RecentActivity activities={stats.recentActivities} />
        </CardContent>
      </Card>
    </div>
  );
}
