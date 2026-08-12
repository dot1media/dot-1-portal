import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { receiptPdf } from "@/lib/receipt";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const store = await cookies();
  if (!verifyToken(store.get(ADMIN_COOKIE)?.value)) return new NextResponse("Unauthorized", { status: 401 });
  const id = String(new URL(request.url).searchParams.get("id") || "");
  if (!id) return new NextResponse("Missing id.", { status: 400 });
  let rows: any[];
  try { rows = (await sql`SELECT * FROM payments WHERE id = ${id} LIMIT 1`) as any[]; }
  catch (e) { return new NextResponse("Could not load the receipt.", { status: 500 }); }
  if (!rows || rows.length === 0) return new NextResponse("Receipt not found.", { status: 404 });
  let b64: string;
  try { b64 = await receiptPdf(rows[0]); }
  catch (e) { return new NextResponse("Could not generate the receipt.", { status: 500 }); }
  return new NextResponse(Buffer.from(b64, "base64"), {
    status: 200,
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="Dot-One-Media-Receipt.pdf"', "Cache-Control": "private, no-store" },
  });
}

