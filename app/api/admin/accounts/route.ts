import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyToken, ADMIN_COOKIE, hashPassword } from "@/lib/auth";
import { ensureAdminTable, isDot1Email, listAdmins, getSuiteAccount } from "@/lib/admins";
import { canManageAccounts, canEditTarget, normalizeGrants, type Tier } from "@/lib/suite";

export const runtime = "nodejs";

// The signed-in account, resolved to its suite identity (tier + grants), or null.
async function actor() {
  const store = await cookies();
  const v = verifyToken(store.get(ADMIN_COOKIE)?.value);
  if (!v) return null;
  await ensureAdminTable();
  return await getSuiteAccount(v.email);
}

export async function GET() {
  const me = await actor();
  if (!me || !canManageAccounts(me)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  return NextResponse.json({ admins: await listAdmins(), meEmail: me.email, meTier: me.tier });
}

export async function POST(request: Request) {
  const me = await actor();
  if (!me || !canManageAccounts(me)) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const b = await request.json().catch(() => ({}));
  const email = String(b.email || "").trim().toLowerCase();
  const name = String(b.name || "").trim();
  const password = String(b.password || "");
  const tier = (["owner", "admin", "user"].includes(b.tier) ? b.tier : "user") as Tier;
  const grants = normalizeGrants(b.grants);

  if (!isDot1Email(email)) return NextResponse.json({ error: "Email must be a @dot1.media address." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  // An admin may only create plain users; only an owner may mint owners or admins.
  if (!canEditTarget(me, tier)) return NextResponse.json({ error: "Only an owner can create owners or admins." }, { status: 403 });

  await sql`INSERT INTO admin_accounts (email, name, password_hash, tier, grants, tier_migrated)
    VALUES (${email}, ${name}, ${hashPassword(password)}, ${tier}, ${JSON.stringify(grants)}::jsonb, true)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, tier = EXCLUDED.tier, grants = EXCLUDED.grants`;
  return NextResponse.json({ ok: true });
}
