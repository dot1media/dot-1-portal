import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { ensureAdminTable, isDot1Email, listAdmins } from "@/lib/admins";

export const runtime = "nodejs";
async function requireAdmin() { const store = await cookies(); return verifyToken(store.get(ADMIN_COOKIE)?.value); }

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureAdminTable();
  return NextResponse.json({ admins: await listAdmins() });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  await ensureAdminTable();
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const password = String(b.password || "");
  if (!isDot1Email(email)) return NextResponse.json({ error: "Email must be a @dot1.media address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  await sql`INSERT INTO admin_accounts (email, name, password_hash) VALUES (${email}, ${name}, ${hashPassword(password)})
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash`;
  return NextResponse.json({ ok: true });
}
