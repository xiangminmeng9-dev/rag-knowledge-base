import { readFile } from "fs/promises";
import { PDFParse } from "pdf-parse";

export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);

  // In Node.js/Vercel environments, we don't necessarily need the worker.
  // pdfjs-dist can fall back to running on the main thread.
  // Setting worker to an empty string disables the worker.
  try {
    PDFParse.setWorker("");
  } catch {
    // Ignore if setWorker fails
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
