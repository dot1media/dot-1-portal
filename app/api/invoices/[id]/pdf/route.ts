import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { buildInvoicePdf } from "@/lib/invoice-pdf";

export const runtime = "nodejs";

// Download an invoice as PDF. Regenerated fresh from the saved record, so the
// file always matches what was sent.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const rows = (await sql`SELECT data FROM invoices WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const inv = rows[0].data || {};
  try {
    const bytes = await buildInvoicePdf(inv);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="' + String(inv.no || "invoice").replace(/[^A-Za-z0-9_-]/g, "") + '.pdf"',
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: "Could not build the PDF." }, { status: 500 });
  }
}
