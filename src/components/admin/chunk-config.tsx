"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChunkConfigValues {
  chunkStrategy: string;
  chunkOverlapPercent: number;
  chunkSize?: number;
}

interface ChunkConfigProps {
  value: ChunkConfigValues;
  onChange: (value: ChunkConfigValues) => void;
}

const strategies = [
  { value: "RECURSIVE", label: "递归切分", description: "默认，通过常用分隔符递归切分文档" },
  { value: "SEMANTIC", label: "语义切分", description: "基于句子和段落的语义边界进行切分" },
  { value: "PARAGRAPH", label: "段落切分", description: "根据空行和换行符按段落切分" },
  { value: "FIXED_SIZE", label: "固定大小切分", description: "严格按照指定的字符数量切分" },
  { value: "SPECIAL_CHAR", label: "特殊字符切分", description: "通过指定的特殊分隔符（如---, ===）切分" },
];

export function ChunkConfig({ value, onChange }: ChunkConfigProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h4 className="text-sm font-medium">文档切分配置</h4>

      <div className="space-y-2">
        <Label>切分策略</Label>
        <Select
          value={value.chunkStrategy}
          onValueChange={(strategy) =>
            strategy && onChange({ ...value, chunkStrategy: strategy })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="请选择切分策略" />
          </SelectTrigger>
          <SelectContent>
            {strategies.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {strategies.find((s) => s.value === value.chunkStrategy)?.description}
        </p>
      </div>

      <div className="space-y-2">
        <Label>
          重叠比例：{value.chunkOverlapPercent}%
        </Label>
        <Input
          type="range"
          min={0}
          max={50}
          step={5}
          value={value.chunkOverlapPercent}
          onChange={(e) =>
            onChange({
              ...value,
              chunkOverlapPercent: Number(e.target.value),
            })
          }
          className="h-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
        </div>
      </div>

      {value.chunkStrategy === "FIXED_SIZE" && (
        <div className="space-y-2">
          <Label>文档块大小 (字符数)</Label>
          <Input
            type="number"
            min={100}
            max={5000}
            value={value.chunkSize ?? 500}
            onChange={(e) =>
              onChange({
                ...value,
                chunkSize: Number(e.target.value) || 500,
              })
            }
            placeholder="500"
          />
          <p className="text-xs text-muted-foreground">
            默认: 500 字符
          </p>
        </div>
      )}
    </div>
  );
}
