import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ link: null, reason: "missing" });
  try {
    const rows = (await sql`SELECT token, data, status FROM direct_links WHERE token = ${token} LIMIT 1`) as any[];
    if (rows.length === 0) return NextResponse.json({ link: null, reason: "notfound" });
    const r = rows[0];
    if (r.status !== "active") return NextResponse.json({ link: null, reason: r.status === "used" ? "used" : "revoked" });
    const d = r.data || {};
    return NextResponse.json({ link: { token: r.token, status: r.status, ...d } });
  } catch (e) {
    return NextResponse.json({ link: null, reason: "error" });
  }
}

export async function POST(request: Request) {
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "");
  try { if (token) await sql`UPDATE direct_links SET status = 'used' WHERE token = ${token} AND status = 'active'`; } catch (e) {}
  return NextResponse.json({ ok: true });
}

