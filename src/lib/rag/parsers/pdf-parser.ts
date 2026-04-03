import { readFile } from "fs/promises";
import { resolve } from "path";
import { PDFParse } from "pdf-parse";

export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);

  try {
    // Try to find the worker in node_modules
    const workerPath = resolve(
      process.cwd(),
      "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"
    );
    PDFParse.setWorker(workerPath);
  } catch {
    // Worker path may not exist in serverless, continue without it
  }

  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
