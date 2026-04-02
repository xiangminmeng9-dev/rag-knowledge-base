export type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  total: number;
  page: number;
  pageSize: number;
};

// Enums - defined here since Prisma SQLite uses strings
export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  KB_ADMIN = "KB_ADMIN",
  QA_USER = "QA_USER",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  DISABLED = "DISABLED",
}

export enum FileFormat {
  PDF = "PDF",
  DOCX = "DOCX",
  TXT = "TXT",
  MD = "MD",
}

export enum ChunkStrategy {
  RECURSIVE = "RECURSIVE",
  SEMANTIC = "SEMANTIC",
  PARAGRAPH = "PARAGRAPH",
  FIXED_SIZE = "FIXED_SIZE",
  SPECIAL_CHAR = "SPECIAL_CHAR",
}

export enum DocumentStatus {
  UPLOADING = "UPLOADING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum MessageRole {
  USER = "USER",
  ASSISTANT = "ASSISTANT",
}
