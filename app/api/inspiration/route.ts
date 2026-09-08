import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { presignGet, deleteObject } from "@/lib/r2";
import { inspKey, ensureInsp, canSee } from "@/lib/inspiration";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const sid = new URL(req.url).searchParams.get("sessionId") || "";
  if (!sid || !(await canSee(sid))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureInsp();
  const rows = (await sql`SELECT id, note, created_at FROM inspiration WHERE session_id = ${sid} ORDER BY created_at ASC`) as any[];
  const items = await Promise.all(rows.map(async (r) => ({ id: r.id, note: r.note || "", url: await presignGet(inspKey(sid, r.id), 3600) })));
  return NextResponse.json({ items });
}
export async function DELETE(req: Request) {
  const url = new URL(req.url); const sid = url.searchParams.get("sessionId") || "", id = url.searchParams.get("id") || "";
  if (!sid || !id || !(await canSee(sid))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureInsp();
  await deleteObject(inspKey(sid, id)); await sql`DELETE FROM inspiration WHERE id = ${id} AND session_id = ${sid}`;
  return NextResponse.json({ ok: true });
}
