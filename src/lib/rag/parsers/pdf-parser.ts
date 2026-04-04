// Uses pdf2json to avoid Vercel Serverless fake worker issues entirely
export async function parsePdf(filePath: string): Promise<string> {
  // Dynamic import of pdf2json to avoid initializing it on non-PDF endpoints
  const pdf2json = await import("pdf2json");
  const PDFParser = pdf2json.default || pdf2json;

  return new Promise((resolve, reject) => {
    try {
      // 1 means return raw text
      const pdfParser = new PDFParser(null, 1);

      pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
      pdfParser.on("pdfParser_dataReady", () => {
        resolve(pdfParser.getRawTextContent());
      });

      pdfParser.loadPDF(filePath);
    } catch (e) {
      reject(e);
    }
  });
}
