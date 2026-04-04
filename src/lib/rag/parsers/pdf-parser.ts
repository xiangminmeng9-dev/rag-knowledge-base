import { readFile } from "fs/promises";
import pdfParse from "pdf-parse";

// pdf-parse 1.1.1 uses an older pdf.js that works synchronously in Node without complex workers
export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const result = await pdfParse(buffer);
  return result.text;
}
