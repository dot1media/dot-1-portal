import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

// Remove a quote (does not affect any invoice already created from it).
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  await sql`DELETE FROM quotes WHERE token = ${id}`;
  return NextResponse.json({ ok: true });
}
