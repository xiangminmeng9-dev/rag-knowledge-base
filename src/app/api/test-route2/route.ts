import { NextResponse } from "next/server";
import { parsePdf } from "@/lib/rag/parsers/pdf-parser";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, typeofParsePdf: typeof parsePdf });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
