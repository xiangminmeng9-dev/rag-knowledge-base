import { readFile } from "fs/promises";

// Polyfill required browser globals for pdf.js running in Node/Vercel
if (typeof globalThis !== "undefined") {
  if (!globalThis.DOMMatrix) {
    globalThis.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    } as any;
  }
  if (!globalThis.Path2D) {
    globalThis.Path2D = class Path2D {} as any;
  }
}

export async function parsePdf(filePath: string): Promise<string> {
  const buffer = await readFile(filePath);

  // Dynamic import so globals are polyfilled first
  const { PDFParse } = await import("pdf-parse");

  // Create parser and extract text
  // We do NOT set workerSrc to "", we let it use the default worker bundled in pdf-parse
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}
