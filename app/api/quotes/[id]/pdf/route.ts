import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { buildQuotePdf } from "@/lib/quote-pdf";

export const runtime = "nodejs";

// Download a quote as a PDF, regenerated from the saved record.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const rows = (await sql`SELECT data FROM quotes WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const q = rows[0].data || {};
  try {
    const bytes = await buildQuotePdf(q);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + String(q.no || "quote").replace(/[^A-Za-z0-9_-]/g, "") + '.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Could not build the PDF." }, { status: 500 });
  }
}
