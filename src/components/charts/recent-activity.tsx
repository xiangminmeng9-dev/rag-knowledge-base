import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Activity {
  fileName: string;
  fileFormat: string;
  status: string;
  uploadedAt: string;
  knowledgeBaseName: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  PROCESSING: "secondary",
  FAILED: "destructive",
  UPLOADING: "outline",
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "已完成",
  PROCESSING: "处理中",
  FAILED: "失败",
  UPLOADING: "上传中",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        暂无上传动态
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>文件名</TableHead>
          <TableHead>格式</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>所属知识库</TableHead>
          <TableHead>上传时间</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((activity, index) => (
          <TableRow key={`${activity.fileName}-${index}`}>
            <TableCell className="max-w-[200px] truncate font-medium">
              {activity.fileName}
            </TableCell>
            <TableCell>{activity.fileFormat}</TableCell>
            <TableCell>
              <Badge variant={STATUS_VARIANT[activity.status] || "outline"}>
                {STATUS_LABEL[activity.status] || activity.status}
              </Badge>
            </TableCell>
            <TableCell>{activity.knowledgeBaseName}</TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(activity.uploadedAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
