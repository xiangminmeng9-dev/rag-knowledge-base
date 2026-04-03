"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UploadIcon, FileIcon, XIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react";
import { ChunkConfig, type ChunkConfigValues } from "@/components/admin/chunk-config";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface DocumentUploadProps {
  knowledgeBaseId: string;
  onUploadComplete: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type)) return true;
  const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
  return ACCEPTED_EXTENSIONS.includes(ext);
}

export function DocumentUpload({
  knowledgeBaseId,
  onUploadComplete,
}: DocumentUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [chunkConfig, setChunkConfig] = useState<ChunkConfigValues>({
    chunkStrategy: "RECURSIVE",
    chunkOverlapPercent: 10,
    chunkSize: 500,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndAddFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const newUploadingFiles: UploadingFile[] = [];

    for (const file of fileArray) {
      if (!isAcceptedFile(file)) {
        newUploadingFiles.push({
          file,
          progress: 0,
          status: "error",
          error: "不支持的格式。接受的格式：PDF、DOCX、TXT、MD",
        });
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        newUploadingFiles.push({
          file,
          progress: 0,
          status: "error",
          error: "文件大小超过 50MB 限制",
        });
        continue;
      }
      if (file.size === 0) {
        newUploadingFiles.push({
          file,
          progress: 0,
          status: "error",
          error: "文件为空",
        });
        continue;
      }
      newUploadingFiles.push({
        file,
        progress: 0,
        status: "pending",
      });
    }

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    // Upload valid files
    for (const uf of newUploadingFiles) {
      if (uf.status === "pending") {
        uploadFile(uf.file);
      }
    }
  }, [knowledgeBaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function uploadFile(file: File) {
    setUploadingFiles((prev) =>
      prev.map((uf) =>
        uf.file === file ? { ...uf, status: "uploading" as const, progress: 10 } : uf
      )
    );

    try {
      const formData = new FormData();
      // Use encodeURIComponent to safely transmit filenames with non-ASCII chars
      const safeName = "upload" + file.name.substring(file.name.lastIndexOf("."));
      formData.append("file", file, safeName);
      formData.append("originalName", encodeURIComponent(file.name)); // Pass real name safely encoded
      formData.append("chunkStrategy", chunkConfig.chunkStrategy);
      formData.append("chunkOverlapPercent", String(chunkConfig.chunkOverlapPercent));
      if (chunkConfig.chunkStrategy === "FIXED_SIZE" && chunkConfig.chunkSize) {
        formData.append("chunkSize", String(chunkConfig.chunkSize));
      }

      // Simulate progress (since fetch doesn't support upload progress natively)
      const progressInterval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.file === file && uf.status === "uploading"
              ? { ...uf, progress: Math.min(uf.progress + 15, 90) }
              : uf
          )
        );
      }, 300);

      const res = await fetch(
        `/api/knowledge-bases/${knowledgeBaseId}/documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(progressInterval);

      if (!res.ok) {
        let errorMsg = "上传失败 (" + res.status + ")";
        try {
          const text = await res.text();
          try {
            const data = JSON.parse(text);
            errorMsg = data.error || errorMsg;
          } catch {
            if (text && text.length < 200) errorMsg = text;
          }
        } catch (e) {
          // Ignore text reading errors
        }
        throw new Error(errorMsg);
      }

      setUploadingFiles((prev) =>
        prev.map((uf) =>
          uf.file === file
            ? { ...uf, status: "success" as const, progress: 100 }
            : uf
        )
      );

      onUploadComplete();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "上传失败";
      setUploadingFiles((prev) =>
        prev.map((uf) =>
          uf.file === file
            ? { ...uf, status: "error" as const, error: errorMessage, progress: 0 }
            : uf
        )
      );
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = "";
    }
  }

  function removeFile(file: File) {
    setUploadingFiles((prev) => prev.filter((uf) => uf.file !== file));
  }

  function clearCompleted() {
    setUploadingFiles((prev) =>
      prev.filter((uf) => uf.status !== "success" && uf.status !== "error")
    );
  }

  const hasCompletedOrFailed = uploadingFiles.some(
    (uf) => uf.status === "success" || uf.status === "error"
  );

  return (
    <div className="space-y-4">
      {/* Chunk Configuration */}
      <ChunkConfig value={chunkConfig} onChange={setChunkConfig} />

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <UploadIcon className="mb-3 size-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          拖拽文件到这里，或点击选择文件
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          支持 PDF, DOCX, TXT, MD (最大 50MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* File List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              文件列表 ({uploadingFiles.length})
            </p>
            {hasCompletedOrFailed && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                清除已完成
              </Button>
            )}
          </div>
          {uploadingFiles.map((uf, index) => (
            <div
              key={`${uf.file.name}-${index}`}
              className="flex items-center gap-3 rounded-lg border p-3"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{uf.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(uf.file.size)}
                </p>
                {uf.status === "uploading" && (
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${uf.progress}%` }}
                    />
                  </div>
                )}
                {uf.error && (
                  <p className="mt-1 text-xs text-destructive">{uf.error}</p>
                )}
              </div>
              <div className="shrink-0">
                {uf.status === "success" && (
                  <CheckCircleIcon className="size-4 text-green-500" />
                )}
                {uf.status === "error" && (
                  <AlertCircleIcon className="size-4 text-destructive" />
                )}
                {(uf.status === "success" || uf.status === "error") && (
                  <button
                    onClick={() => removeFile(uf.file)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
