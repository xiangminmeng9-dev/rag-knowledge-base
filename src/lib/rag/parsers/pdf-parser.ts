// Use LangChain's PDFLoader which has built-in shims for Vercel/Node environments
// and correctly sets useWorkerFetch: false and isEvalSupported: false to avoid
// the "Setting up fake worker failed" error.
export async function parsePdf(filePath: string): Promise<string> {
  const { PDFLoader } = await import("@langchain/community/document_loaders/fs/pdf");
  const loader = new PDFLoader(filePath, { splitPages: false });
  const docs = await loader.load();
  return docs.map(doc => doc.pageContent).join("\n\n");
}
