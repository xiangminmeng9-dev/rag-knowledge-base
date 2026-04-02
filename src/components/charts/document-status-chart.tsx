"use client";

import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface DocumentStatusChartProps {
  data: Array<{ status: string; count: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#34d399",
  PROCESSING: "#fbbf24",
  FAILED: "#fb7185",
  UPLOADING: "#60a5fa",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "已完成",
  PROCESSING: "处理中",
  FAILED: "失败",
  UPLOADING: "上传中",
};

export default function DocumentStatusChart({ data }: DocumentStatusChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: {
      orient: "vertical",
      left: "left",
      top: "center",
      textStyle: { color: isDark ? "#9ca3af" : "#6b7280", fontFamily: "DM Sans" },
    },
    series: [{
      name: "文档状态",
      type: "pie",
      radius: ["45%", "72%"],
      center: ["60%", "50%"],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 8, borderColor: "transparent", borderWidth: 3 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 13, fontWeight: "600", color: isDark ? "#e5e7eb" : "#1f2937", fontFamily: "Outfit" },
        scaleSize: 6,
      },
      data: data.map((item) => ({
        value: item.count,
        name: STATUS_LABEL[item.status] || item.status,
        itemStyle: { color: STATUS_COLORS[item.status] || "#94a3b8" },
      })),
    }],
  };

  return <ReactECharts option={option} style={{ height: "300px", width: "100%" }} opts={{ renderer: "svg" }} />;
}
