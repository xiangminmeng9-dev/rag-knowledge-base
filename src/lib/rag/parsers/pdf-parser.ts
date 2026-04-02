import { readFile } from "fs/promises";
import { resolve } from "path";
import { PDFParse } from "pdf-parse";

// Set the worker source to the bundled worker file
const workerPath = resolve(
  process.cwd(),
  "node_modules/pdf-parse/dist/pdf-parse/cjs/pdf.worker.mjs"
);
PDFParse.setWorker(workerPath);

export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
