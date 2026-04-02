import { FileFormat } from "@/types";
import { parsePdf } from "./pdf-parser";
import { parseDocx } from "./docx-parser";
import { parseText } from "./text-parser";

export async function parseDocument(
  filePath: string,
  format: FileFormat
): Promise<string> {
  switch (format) {
    case FileFormat.PDF:
      return parsePdf(filePath);
    case FileFormat.DOCX:
      return parseDocx(filePath);
    case FileFormat.TXT:
    case FileFormat.MD:
      return parseText(filePath);
    default: {
      const _exhaustive: never = format;
      throw new Error(`Unsupported file format: ${_exhaustive}`);
    }
  }
}
