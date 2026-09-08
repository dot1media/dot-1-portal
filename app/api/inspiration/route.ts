import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { currentClientEmail } from "@/lib/gallery";
import { presignGet, deleteObject } from "@/lib/r2";
export const runtime = "nodejs";
export const inspKey = (sid: string, id: string) => `inspiration/${sid}/${id}.jpg`;
export async function ensureInsp() { await sql`CREATE TABLE IF NOT EXISTS inspiration (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, client_email TEXT, note TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now())`; }
export async function canSee(sessionId: string) {
  if (await hasStudio()) return true;
  const em = await currentClientEmail(); if (!em) return false;
  const r = ((await sql`SELECT client_email FROM portal_sessions WHERE id = ${sessionId} LIMIT 1`) as any[])[0];
  return !!r && String(r.client_email || "").toLowerCase() === em;
}
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
