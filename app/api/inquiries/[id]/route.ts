import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";

export const runtime = "nodejs";

async function isAdmin() { const store = await cookies(); return !!verifyToken(store.get(ADMIN_COOKIE)?.value); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const id = parseInt((await params).id, 10);
  const b = await request.json().catch(() => ({}));
  await sql`UPDATE site_inquiries SET handled = ${!!b.handled} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const id = parseInt((await params).id, 10);
  await sql`DELETE FROM site_inquiries WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
