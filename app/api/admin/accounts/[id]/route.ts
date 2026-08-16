import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { ensureAdminTable, adminCount } from "@/lib/admins";

export const runtime = "nodejs";
async function requireAdmin() { const store = await cookies(); return verifyToken(store.get(ADMIN_COOKIE)?.value); }

// Next 16: params is a Promise.
export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const me = await requireAdmin();
  if (!me) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureAdminTable();
  const { id } = await ctx.params;
  const rows = await sql`SELECT email FROM admin_accounts WHERE id = ${parseInt(id, 10)} LIMIT 1`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (rows[0].email === me.email) return NextResponse.json({ error: "You can't remove the account you're signed in with." }, { status: 400 });
  if ((await adminCount()) <= 1) return NextResponse.json({ error: "Can't remove the last admin." }, { status: 400 });
  await sql`DELETE FROM admin_accounts WHERE id = ${parseInt(id, 10)}`;
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureAdminTable();
  const { id } = await ctx.params;
  const b = await request.json().catch(() => ({}));
  const password = String(b.password || "");
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  const rows = await sql`UPDATE admin_accounts SET password_hash = ${hashPassword(password)} WHERE id = ${parseInt(id, 10)} RETURNING id`;
  if (rows.length === 0) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
