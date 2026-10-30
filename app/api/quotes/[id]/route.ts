import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

// Soft-delete a quote by default: it moves to "Recently deleted" and can be
// restored, so a quote can't vanish for good by accident. Pass ?hard=1 to
// permanently remove one (used from the Recently deleted view). Deleting never
// touches any invoice already created from the quote.
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const { id } = await params;
  const hard = new URL(request.url).searchParams.get("hard") === "1";

  if (hard) {
    await sql`DELETE FROM quotes WHERE token = ${id}`;
    return NextResponse.json({ ok: true, hard: true });
  }

  const rows = (await sql`SELECT status FROM quotes WHERE token = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Quote not found." }, { status: 404 });
  const prev = rows[0].status || "quote";
  if (prev === "deleted") return NextResponse.json({ ok: true });
  // Remember the prior status so Restore puts a converted quote back as converted.
  await sql`UPDATE quotes SET status = ${"deleted"}, data = data || ${JSON.stringify({ prevStatus: prev, deletedAt: Date.now() })}::jsonb WHERE token = ${id}`;
  return NextResponse.json({ ok: true });
}
