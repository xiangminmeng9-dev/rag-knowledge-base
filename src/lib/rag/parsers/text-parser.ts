import { readFile } from "fs/promises";

export async function parseText(filePath: string): Promise<string> {
  const content = await readFile(filePath, "utf-8");
  return content;
}
