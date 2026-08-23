import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";

export const runtime = "nodejs";

async function isAdmin() {
  const store = await cookies();
  return await hasStudio();
}
function toLink(row: any) {
  const d = row.data || {};
  return { id: row.token, token: row.token, status: row.status, createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(), ...d };
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  try {
    const rows = (await sql`SELECT token, data, status, created_at FROM direct_links ORDER BY created_at DESC`) as any[];
    return NextResponse.json({ links: rows.map(toLink) });
  } catch (e) {
    return NextResponse.json({ links: [] });
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "");
  const data = b.data || {};
  if (!/^dl_[A-Za-z0-9]+$/.test(token)) return NextResponse.json({ error: "Invalid link token." }, { status: 400 });
  try {
    await sql`INSERT INTO direct_links (token, data, status) VALUES (${token}, ${JSON.stringify(data)}::jsonb, 'active') ON CONFLICT (token) DO NOTHING`;
    return NextResponse.json({ ok: true, token });
  } catch (e) {
    return NextResponse.json({ error: "Could not save the link." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const token = new URL(request.url).searchParams.get("token") || "";
  try { if (token) await sql`DELETE FROM direct_links WHERE token = ${token}`; } catch (e) {}
  return NextResponse.json({ ok: true });
}

