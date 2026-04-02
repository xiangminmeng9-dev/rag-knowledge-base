"use client";

import ReactECharts from "echarts-for-react";
import { useTheme } from "next-themes";

interface DocumentFormatChartProps {
  data: Array<{ format: string; count: number }>;
}

const COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#fb7185", "#a78bfa"];

export default function DocumentFormatChart({ data }: DocumentFormatChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const splitColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)";

  const option = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category",
      data: data.map((item) => item.format),
      axisLabel: { fontSize: 11, color: textColor, fontFamily: "DM Sans" },
      axisLine: { lineStyle: { color: splitColor } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: textColor, fontFamily: "DM Sans" },
      splitLine: { lineStyle: { color: splitColor } },
    },
    series: [{
      name: "文档数",
      type: "bar",
      data: data.map((item, i) => ({
        value: item.count,
        itemStyle: { borderRadius: [6, 6, 0, 0], color: COLORS[i % COLORS.length] },
      })),
      barWidth: "45%",
    }],
    grid: { left: "3%", right: "4%", bottom: "3%", top: "10%", containLabel: true },
  };

  return <ReactECharts option={option} style={{ height: "300px", width: "100%" }} opts={{ renderer: "svg" }} />;
}
