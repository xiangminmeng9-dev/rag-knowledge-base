import { FileFormat } from "@/types";

export async function parseDocument(
  filePath: string,
  format: FileFormat
): Promise<string> {
  switch (format) {
    case FileFormat.PDF:
      const { parsePdf } = await import("./pdf-parser");
      return parsePdf(filePath);
    case FileFormat.DOCX:
      const { parseDocx } = await import("./docx-parser");
      return parseDocx(filePath);
    case FileFormat.TXT:
    case FileFormat.MD:
      const { parseText } = await import("./text-parser");
      return parseText(filePath);
    default: {
      const _exhaustive: never = format;
      throw new Error(`Unsupported file format: ${_exhaustive}`);
    }
  }
}
