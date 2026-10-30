import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

// Restore a soft-deleted quote to its prior status (quote or converted).
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const rows = (await sql`SELECT data FROM quotes WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  const prev = (rows[0].data && rows[0].data.prevStatus) || "quote";
  await sql`UPDATE quotes SET status = ${prev}, data = (data - 'deletedAt') - 'prevStatus' WHERE token = ${id}`;
  return NextResponse.json({ ok: true, status: prev });
}
